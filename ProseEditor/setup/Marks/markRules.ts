import { keymap }       from "prosemirror-keymap";
import { InputRule, inputRules }    
                        from "prosemirror-inputrules";
import { Fragment, Mark, MarkType, Node, Schema, Slice } 
                        from "prosemirror-model";
import { EditorState, Plugin } 
                        from "prosemirror-state";
import { BindingRules, MarkActions, PluginBinding, RuleBinding }        
                        from "../schema";

/** 
 * provides a `prosemirror` `plugin` for each of the `inputrules`, `pasteRules`, and `keys` 
 * in the provided `marks`
 */
export function markRules(marks:BindingRules<MarkActions>[], schema: Schema):Plugin[] {
   return marks.flatMap(mark => {
      const type = getTypeFromSchema(mark.specName, schema)
      const map = mark.keys
         ? Object.fromEntries(Object
            .entries(mark.keys())
            .map(([key, action])=> [key, action()]))
         : {}

      return [
         inputRules({ rules: mark.inputRules?.map(r => markInputRule(r, type)) ?? []}),
         ...mark.pasteRules?.map(r => markPastePlugin(r, type)) ?? [],
         keymap(map)
      ]
   })
}


function getTypeFromSchema(name:string, schema: Schema):MarkType {
   const markType = schema.marks[name];
   if (!markType) throw Error(`markType ${name} not found`)
   return markType;
}


function markInputRule(binding:string|RegExp|RuleBinding, markType:MarkType): InputRule {
   if (typeof binding==='function') return binding(markType)
   const regexp = typeof binding==='string'
      // ? new RegExp(`(?:^|\\s)((?:${binding})([^~\`*^=_]+)(?:${binding}))(?=[^a-zA-Z0-9])`)
      ? new RegExp(`(?:^|\\s)((?:${binding})([^~\`*^=_]+)(?:${binding}))$`)
      : binding
   return new InputRule(regexp, (state, match, start, end) => {
      const { tr } = state;
      const m = match.length - 1;
      let markEnd = end;
      let markStart = start;

      const textMatch = match[m];
      const exprMatch = match[0];
      const markMatch = match[m - 1];

      if (textMatch != null && exprMatch != null && markMatch != null) {
         const matchStart = start + exprMatch.indexOf(markMatch);
         const matchEnd   = matchStart + markMatch.length   // - 1;
         const textStart  = matchStart + markMatch.lastIndexOf(textMatch);
         const textEnd = textStart + textMatch.length;

         const excludedMarks = getMarksBetween(start, end, state)
         .filter(item => item.mark.type.excludes(markType))
         .filter(item => item.end > matchStart)

         if (excludedMarks.length)   return null;
         if (textEnd < matchEnd)     tr.delete(textEnd, matchEnd)
         if (textStart > matchStart) tr.delete(matchStart, textStart)
         
         markStart = matchStart;
         markEnd = markStart + textMatch.length;
      }

      tr.addMark(markStart, markEnd, markType.create());
      tr.removeStoredMark(markType);
      // if the regexp has a trailing guard, e.g. (?:\W) in `underline`: conserve the trailing part:
      const trailingChars = exprMatch.slice(exprMatch.indexOf(markMatch)+markMatch.length)
      tr.insertText(trailingChars)
      return tr;
   });
}


function markPastePlugin(binding:string|RegExp|Plugin|PluginBinding, type:MarkType, getAttrs?:Mark['attrs'] | ((match: RegExpMatchArray) => Mark['attrs'])):Plugin {
   if ((binding as Plugin).spec) return binding as Plugin
   if (typeof binding==='function') return binding(type, getAttrs)
   return new Plugin({props: {
      transformPasted: (slice) => new Slice(handler(slice.content), slice.openStart, slice.openEnd),
   }})
      
   function handler(fragment: Fragment, parent?: Node):Fragment {
      const nodes: Node[] = [];
      const regexp = binding as RegExp
      fragment.forEach((child) => {
         if (child.isText) {
            const { text, marks } = child
            let pos = 0
            let match:RegExpMatchArray|null
            const isLink = !!marks.filter((x) => x.type.name === 'link')[0]

            while (!isLink && (match = regexp.exec(text!)) !== null) {
               const start = match.index ?? 0
               const m = match.length - 1
               const textMatch = match[m];
               const exprMatch = match[0];
               const markMatch = match[m - 1];
            
               if (parent && parent.type.allowsMarkType(type) && markMatch) {
                  const matchStart = start + exprMatch.indexOf(markMatch)
                  const matchEnd   = start + exprMatch.length
                  const textStart = matchStart + markMatch.indexOf(textMatch)
                  const textEnd   = textStart + textMatch.length
                  const attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs

                  // adding text before markdown to nodes
                  if (matchStart > 0) nodes.push(child.cut(pos, matchStart))

                  // adding the markdown part to nodes
                  nodes.push(child
                     .cut(textStart, textEnd)
                     .mark(type.create(attrs).addToSet(child.marks))
                  )
                  pos = matchEnd
               }
            }
            // adding rest of text to nodes
            if (pos < text!.length) nodes.push(child.cut(pos))
         } else {
            nodes.push(child.copy(handler(child.content, child)));
         }
      })
      return Fragment.fromArray(nodes);
   }
}

function getMarksBetween(start: number, end: number, state: EditorState) {
   let marks: Array<{ start: number; end: number; mark: Mark }> = [];

   state.doc.nodesBetween(start, end, (node, pos) => {
      marks = [
         ...marks,
         ...node.marks.map((mark) => ({
            start: pos,
            end: pos + node.nodeSize,
            mark,
         })),
      ]
   })
   return marks;
}

