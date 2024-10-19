import { Mark, MarkType, Node }   
                        from "prosemirror-model";
import { Command, EditorState, Plugin } 
                        from "prosemirror-state";
import { InputRule }    from "prosemirror-inputrules";
import { Token }        from "markdown-it";
import { quote }        from "../utils";
import { MarkDef, PluginBinding, RuleBinding }      
                        from "../schema"
import { selectedText } from "./markDefs";


const specName = 'link'
const PASTE_LINK = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-zA-Z]{2,}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g
const INPUT_EXP = /(^|\s)\[([^\]]+)\]\(((http|https):\/\/)?([^\)]+)\)(\s|$)/
const URL_REGEX = /(^|\s)(((http|https):\/\/)?(?:[^\s.:\/]+\.)+(?:[a-zA-Z]+))\s$/

export const link:MarkDef = {
   specName,
   schemaSpec: {
      attrs: {
         href: {},
         title: {default: null}
      },
      inclusive: false,
      parseDOM: [{
         tag: 'a[href]', 
         getAttrs(dom) {
         return {
            href: dom.getAttribute('href'), 
            title: dom.getAttribute('title')
         }
      }}],
      toDOM(node) { return ['a', node.attrs] }
   },
   actions: {
      isActive:   ()=>isLinkActive(),
      createLink: (href:string): Command => wrapInLink(href),
      updateLink: (href:string): Command => wrapInLink(href),
   },
   pasteRules: [
      pasteLink(PASTE_LINK),
   ],
   inputRules: [
      linkInputRule(INPUT_EXP),
      autoLinkInputRule(URL_REGEX),
   ],
   toMarkdown:   {
      open(_state, mark, parent, index) {
         return isPlainURL(mark, parent, index, 1) ? '<' : '[';
      },
      close(state, mark, parent, index) {
         return isPlainURL(mark, parent, index, -1)
            ? '>'
            : '](' +
               state.esc(mark.attrs['href']) +
               (mark.attrs['title'] ? ' ' + quote(mark.attrs['title']) : '') +
               ')';
      },
   },
   fromMarkdown: {
      [specName]: {
         mark: specName,
         getAttrs: (tok: Token) => ({
            href: tok.attrGet('href'),
            title: tok.attrGet('title') || null,
         }),
      }
   }
}

/** typing a link: [...text...](...link...) */
function linkInputRule(regexp: RegExp):RuleBinding {
   return (type: MarkType) => new InputRule(INPUT_EXP, (state, match, start, end) => {
      if (!match[0]) return null
      const [_, leadingSpace, text,, scheme, link] = match;
      const first = leadingSpace?.length > 0 ? start + 1 : start
      const href = `${scheme?`${scheme}://`:''}${link}`
      const tr = state.tr
         .delete(first,end)  // Ignore the leading space, if any
         .insertText(`${text}`, first)
         .addMark(
            first,
            first+text.length,
            type.create(linkAttrs(scheme, href)),
         )
      return tr;
   });
}

/** paste a link  */
function pasteLink(regexp: RegExp):PluginBinding {
   return () => new Plugin({
      props: {
         handlePaste: function handlePastedLink(view, rawEvent) {
            const event = rawEvent;
            if (!event.clipboardData) return false
            let text = event.clipboardData.getData('text/plain');
            const html = event.clipboardData.getData('text/html');

            const isPlainText = text && !html;
            if (!isPlainText || view.state.selection.empty) return false

            const { state, dispatch } = view;
            const matches = matchAllPlus(regexp, text);
            const singleMatch = matches.length === 1 && matches.every(m => m.match);
            // Only handle if paste has one URL
            if (!singleMatch) return false
            return wrapInLink(text)(state, dispatch);
         },
      },
   })
}


/** automatically inserts a link when typing a complete URL, e.g. http://mydomain.com or www.example.com */
function autoLinkInputRule(regexp: RegExp) {
   return (type: MarkType) => new InputRule(regexp, (state, match, start, end) => {
      if (!match[0]) return null
      const [_, leadingSpace, text, scheme] = match;
      if (!leadingSpace) {
         // Do nothing if there is already a link within [start, end]. This is for
         // cases like "<link>abc.com</link>def.com[]". In such case typing a space
         // after def.com should not auto link.
         let ignore = false;
         state.doc.nodesBetween(start, end, (node) => {
            if (ignore) return false
            if (type.isInSet(node.marks)) {
               ignore = true;
               return false;
            }
            return true;
         });

         if (ignore) return null
      }
      const tr = state.tr;
      tr.addMark(
         // Ignore the leading space, if any
         leadingSpace && leadingSpace.length > 0 ? start + 1 : start,
         end,
         type.create(linkAttrs(scheme, text)),
      );
      // Append the space after the link
      tr.insertText(' ', end);
      return tr;
   });
}


/**
 * Returns an array of objects which describe matches of substrings and whether it matched or didn't match.
 */
function matchAllPlus(regexp: RegExp, str: string): MatchType[] {
   const result: MatchType[] = []
   let prevElementEnd = 0
   let match: RegExpExecArray | null
   while ((match = regexp.exec(str))) {
      const curStart = match.index
      const curEnd = curStart + match[0]!.length
      if (prevElementEnd !== curStart) {
         result.push({start:prevElementEnd, end:curStart, match:false})
      }
      result.push({start:curStart, end:curEnd, match:true})
      prevElementEnd = curEnd
   }
   if (result.length === 0) {
      return [{start:0, end:str.length, match:false}]
   }

   const lastItemEnd = result[result.length - 1] && result[result.length - 1]!.end

   if (lastItemEnd && lastItemEnd !== str.length) {
      result.push({start:lastItemEnd, end:str.length, match:false})
   }
   return result
}
type MatchType = {start: number, end: number, match: boolean}



/**
 * returns the attributes for creating a link via `linkMark.create(<attr>).
 * If `href` is not local or scheme is an empty string, the `https://` prefix will be added to `href`.
 * Local `hrefs` start with either `./` or `/` 
 */
function linkAttrs(scheme:string, href:string) {
   // don't add scheme ('http') if link is local:
   const localLink = href.indexOf('./')===0 || href.indexOf('/')===0
   // markdown-it doesn't like spaces in links:
   href = encodeURI(scheme || localLink ? href : `https://${href}`)
   return { href, title:href }
}

function isPlainURL(link: Mark, parent: Node, index: number, side: number) {
   if (link.attrs['title'] || !/^\w+:/.test(link.attrs['href'])) return false
   let content = parent.child(index + (side < 0 ? -1 : 0));
   if (
      !content.isText ||
      content.text !== link.attrs['href'] ||
      content.marks[content.marks.length - 1] !== link
   ) return false;
   if (index === (side < 0 ? 1 : parent.childCount - 1)) return true;
   let next = parent.child(index + (side < 0 ? -2 : 1));
   return !link.isInSet(next.marks);
}


/**
 *
 * Commands
 *
 */

/** Wraps the selection in a link */
function wrapInLink(href:string):Command {
   return  (state, dispatch) => {
      if (!isLinkAllowedInRange(state.selection.$from.pos, state.selection.$to.pos)(state)) 
         return false
      const [from, to] = [state.selection.$from.pos, state.selection.$to.pos];
      const linkMark = state.schema.marks[specName]
      // first, clear link (if any)
      let tr = state.tr.removeMark(from, to, linkMark);
      // then create link if href has content
      if (href.trim()) tr.addMark(from, to, linkMark.create(linkAttrs('https', decodeURI(href))));
      dispatch?.(tr);
      return true;
   }
}

function isLinkAllowedInRange(from: number, to: number):Command {
   return (state: EditorState): boolean => {
      const $from = state.doc.resolve(from);
      const $to = state.doc.resolve(to);
      const link = state.schema.marks[specName]
      if ($from.parent === $to.parent && $from.parent.isTextblock)
         return $from.parent.type.allowsMarkType(link)
      return false;
   };
}

function isLinkActive() {
   return(state: EditorState) => {
      const type = state.schema.marks[specName]
      const set = state.selection.$from.marks()
      return Boolean(type.isInSet(set));
   }
}


export function getLink(state: EditorState) {
   const { from, to } = state.selection
   const text = selectedText(state)
   let href = ''
   state.doc.nodesBetween(from, to, (node:Node, pos:number) => {
      node.marks.forEach(mark => {
         const attrs = mark.attrs
         if (attrs.href) href = attrs.href
         console.log(attrs)
      })
      return true
   })
   return {href, text}
}