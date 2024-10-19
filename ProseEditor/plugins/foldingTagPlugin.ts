import { Node }                  from "prosemirror-model";
import { Plugin, PluginKey, Transaction, EditorState }          
                                 from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } 
                                 from "prosemirror-view";
import { pluginTiming }          from "../hooks/useTimings";


export const getID = (prefix='id') => `${prefix}${Math.round(Math.random()*10000000)}`

const pluginName  = "foldingTagsPlugin"
export const foldingTagPluginKey = new PluginKey<TagsState>(pluginName)
const {tmInit, tmApply, tmDecos} = pluginTiming(pluginName)

// matches a `#tag` 
const anchorMatch = /#([a-zA-Z0-9_-]+)(?:\W|$)/g;
// matches `tag` between non-word characters in a text
const tagMatch    = (tag:string) => new RegExp(`(^|\\W)(${tag})($|\\W)`, 'g')
const tagStyle    = 'background-color:#ddb;padding:0 2px;border-radius:5px;'
const tagDefStyle = 'color:#00f;'

const PREFIX_TAG     = 'tag_'
const PREFIX_ELLIPSE = 'ellipse_'

interface Ellipse {
   id:   string
   deco: Decoration
}
export interface TagsState {
   ellipses:      Ellipse[]
   tags:          string[]       // list of `#<tag>` anchors
   anchorDecos:   Decoration[]   // decorations for `#<tag>` anchors
   tagsDecos:     Decoration[]   // decorations for tag matches
   hiddenDecos:   Decoration[]   // decorations for hidden nodes, ellipses, occurrences of `tag`
   decos:         DecorationSet  // the set of all decos above
}

/** 
 * Creates and maintains a list of tags that the document can be **focused** on. 
 * The plugin searches the document for words beginning with `#` and turns them into tags.
 * Tags are visually emphasized and clickable. When clicking a tag the document filters and folds
 * away paragraphs that don't contain the tag (without the `#`) and highlights the tag in the remaining,
 * visible paragraphs.
 * 
 * The plugin state consists of the set of all tags wrapped in `Decorations`. This can be used
 * elsewhere in the program, for example to show a list of known tags.
 * 
 * Text-folding of blocks not containing a tag can be programmatically triggered by dispatching 
 * a transaction that carries the `tag` as `meta` information (using `tr.setMeta(foldingTagPluginKey, tag)`)
 */
export const foldingTagPlugin = () => {
   return new Plugin<TagsState>({
      state: {
         init(_, state:EditorState) { 
            return tmInit(()=>{
               const {tags, anchorDecos} = findTags(state.doc)
               const tagsDecos = tmInit(()=>markTags(tags, state.doc)); 
               const decos = DecorationSet.create(state.doc, [...anchorDecos, ...tagsDecos])
               return {tags, anchorDecos, tagsDecos, decos, hiddenDecos:[], ellipses:[]}
            })
         },
         apply(tr:Transaction, pState:TagsState, oldState:EditorState, newState:EditorState) { 
            return tmApply(()=> {
               // `<tag>` or `##<pos>#` passed as meta information on the plugin
               const tag = tr.getMeta(foldingTagPluginKey) as string 
               if (tag) {
                  pState = hideOrUnhide(tag, pState, newState)
                  pState.decos = DecorationSet.create(newState.doc, [...pState.anchorDecos, ...pState.tagsDecos, ...pState.hiddenDecos])
               } else {
                  if (!tagChanges(tr, pState.tags)) {
                     // no tag changes, only update deco positions
                     pState.decos = pState.decos.map(tr.mapping, newState.doc)
                  } else {
                     // reconstruct all tag anchors and decos 
                     const {tags, anchorDecos} = findTags(newState.doc)
                     const tagsDecos = markTags(tags, newState.doc)
                     pState.anchorDecos = anchorDecos
                     pState.tags = tags
                     pState.tagsDecos = tagsDecos
                     pState.decos = DecorationSet.create(newState.doc, [...anchorDecos, ...tagsDecos, ...pState.hiddenDecos])
                  }
               }
               return pState
            }
         )},
      },
      props: {
         decorations(state) {
            const pstate = this.getState(state)
            const decos = pstate?.decos
            return tmDecos(()=> decos)
         }
      },
      view: (view) => {
         createWindowTagClick(view)
         return { update: () => {} }
      },
      key: foldingTagPluginKey,
   });
};

/** check only the changed node for new tags */
function tagChanges(tr:Transaction, tags:string[]):boolean {
   const node = tr.selection.$anchor.parent
   const matchDecos = markTags(tags, node)
   return (findTags(node, false).tags.length>0 || matchDecos.length>0)
}

/**
 * Called when the plugin state's `apply` method is called in response to setting the `meta` state with a 
 * `#tag` or `##pos#` value.
 * Checks if a tag or an ellipse was clicked (as passed via `getMeta()`) and either 
 * - hides all paragraphs not containing the clicked *tag*
 * - or unhides hidden paragraphs when an *ellipse* is clicked
 */
function hideOrUnhide(tag:string, pState:TagsState, newState:EditorState):TagsState {
   if (tag.startsWith(PREFIX_TAG)) {
      const [visDecos, ellipses] = hideNonTagMatches(newState.doc, tag.slice(PREFIX_TAG.length))
      pState.hiddenDecos = visDecos
      pState.ellipses = ellipses
   } else if (tag.startsWith(PREFIX_ELLIPSE)) {
      const deco = pState.ellipses.find(el =>el.id===tag)?.deco
      if (deco) 
         if (deco.from===0) { // root doc: unhide all
            pState.hiddenDecos = []
            pState.ellipses = []
         } else 
            pState = unhide(deco, pState)
   }
   return pState
}

function createWindowTagClick(view:EditorView) {
   // define window-level click-response function
   (window as any)._tagClickAction =  (tag:string) => {
      // send the `searchTag` text to the filter as meta information
      view.dispatch(view.state.tr.setMeta(foldingTagPluginKey, tag))
   }
}


/**
 * unhides a segment by removing the appropriate consequtive decorations from `matches`, 
 * starting with the first deco whose `from` field matches `pos`, and continuing while
 * nodes have a class `hidden`. 
 */
function unhide(deco:Decoration, pState:TagsState):TagsState {
   let keep = true
   pState.hiddenDecos = pState.hiddenDecos.filter(dec => {
      // unhide from initial pos match through all consecutive `class='hidden'` matches
      if (dec.from===deco.from) { // unhide initial pos match
         pState.ellipses = pState.ellipses.filter(el => el.deco.from!==deco.from)
         keep = false
      } else if (!keep && (dec as any).type.attrs?.class !== 'hidden') 
         keep = true // stop unhiding here: no class match
      return keep
   })
   return pState
}


/**
 * - hide all blocks that do not contain `tag`.
 * - add ellipses on left border for each continuous
 *   sequence of hidden blocks, and make them expandable

 */
 function hideNonTagMatches(doc: Node, tag:string): [Decoration[], Ellipse[]] {
   const decos: Decoration[] = [];
   const ellipses:Ellipse[] = []
   let hidden = false;

   doc.descendants((node: Node, pos: number) => {
      if (node.type.name === "listItem" || node.isTextblock) {
         if (contains(node, tag)) {
            hidden = false;   // setup for next hidden block
         } else {
            decos.push(Decoration.node(pos, pos + node.content.size + 2, { class: "hidden" }));
            if (!hidden) {
               const id = getID(PREFIX_ELLIPSE)
               const deco = Decoration.widget(pos, ellipsesDiv(id))
               decos.push(deco)
               ellipses.push({id, deco})
            }
            hidden = true;    // add ellipses only once per hidden block
         } 
      }
   });
   return [decos.filter(d=>d), ellipses]
}


/**
 * assemble decorations for all known `tags` within `node`
 */
function markTags(tags:string[], node: Node):Decoration[] {
   const matchDecos:Decoration[] = []
   tags.forEach(tag => matchDecos.push(...markTag(node, tag)))
   return matchDecos.filter(d=>d)
}

/**
 * create decorations for all paragraph matches of `tag`
 */
 function markTag(doc:Node, tag:string):Decoration[] {
   const matches: Decoration[] = []
   doc.descendants(markTextBlock)
   return matches

   function markTextBlock(n: Node, pos: number) {
      let rel=pos
      if (n.isText && n.text) {
         const reg = tagMatch(tag)
         let match:RegExpExecArray | null;
         while ((match = reg.exec(n.text)) !== null) {
            const start = rel+match.index+match[1].length
            matches.push(Decoration.inline(start, start+tag.length, {
               style: tagStyle,
               onmousedown: `_tagClickAction('${PREFIX_TAG}${tag}')`
            }))
         }
         rel += n.text?.length ?? 0
      }
   }
}

/**
 * find all `#<tag>` anchors in the node, highlight them, and make them clickable as tags.
 */
function findTags(node: Node, textBlock=true):{tags:string[], anchorDecos:Decoration[]} {
   const tags: string[] = []
   const anchorDecos: Decoration[] = [];
   node.descendants((node: Node, pos: number) => {
      let rel=pos
      if (textBlock && node.isTextblock && (node.content as any).content[0]) {
         (node.content as any).content.forEach((c:{text:string}) => {
            const {tags:t, anchorDecos:a} = tagMatches(c.text, rel)
            tags.push(...t)
            anchorDecos.push(...a)
            rel += c.text?.length ?? 0
         });
      } else if (!textBlock && node.isText && node.text) {
         const {tags:t, anchorDecos:a} = tagMatches(node.text, rel)
         tags.push(...t)
         anchorDecos.push(...a)
         rel += node.text?.length ?? 0
      }
   });
   return {tags:tags.filter(d=>d), anchorDecos:anchorDecos.filter(d=>d)}
}


interface TagMatches {
   tags:             string[]       // list of `#<tag>` anchors
   anchorDecos:      Decoration[]   // decorations for `#<tag>` anchors
}
/**
 * find all `#<tag>` anchors in a node's `text`, highlight them, and make them clickable as tags.
 * @param c 
 * @param rel 
 * @returns all found tags and corresponding anchor decorations
 */
function tagMatches(text:string, rel:number):TagMatches  {
   const anchorDecos: Decoration[] = []
   const tags: string[] = []
   const matches = Array.from(text?.matchAll(anchorMatch) ?? [])
   matches.map((match) => {
      const p = rel+(match.index??0)+1;
      const tag = match[1].trim()   //remove `#`: `#tag` -> `tag`
      tags.push(tag)
      anchorDecos.push(Decoration.inline(p, p+match[1].length+1, {
         style: tagDefStyle,
         onmousedown: `_tagClickAction('${PREFIX_TAG}${tag}')`
      }))
   });
   return {tags, anchorDecos}
}



const contains = (node:Node, text:string) => node.textContent.indexOf(text) >= 0

/** 
 * returns a new `div` element that shows an ellipse and includes 
 * an `onMouseDown` listener 
 */
function ellipsesDiv(id:string) {
   let div = document.createElement("div");
   div.className = `ellipses`;
   div.innerText = encodeURI(`...`);  
   div.onmousedown = (e: MouseEvent) => (window as any)._tagClickAction(id)
   return div;
}

