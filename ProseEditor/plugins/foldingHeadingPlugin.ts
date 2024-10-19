import { Decoration, DecorationSet, EditorView } 
                           from "prosemirror-view";
import { EditorState, Plugin, PluginKey } 
                           from "prosemirror-state";
import { Node }            from "prosemirror-model";
import { Log }             from '@hauke5/lib/utils/log'; 
import { pluginTiming }    from "../hooks/useTimings";
import styles              from '../styles/proseEditor.module.scss'
import { findChildren }    from "../setup/Nodes";
 
const log         = Log('foldingHeadingPlugin');
const pluginName  = "foldingHeadingPlugin"
const heading     = 'heading';

export const foldingHeadingPluginKey  = new PluginKey(pluginName)


interface Meta {
   level:   number
   title:   string
}

const isHeading = (node:Node):boolean => node.type === node.type.schema.nodes[heading];

interface Heading {
   level:   number
   title:   string
   deco:    Decoration
}
export interface HeadingState {
   headings:      Heading[]
   headingDecos:  Decoration[] // Node[]
   decoSet:       DecorationSet
}

/**
 * A plugin that allows folding of headings at all levels, and recursively.
 * Folded text only changes `Decorations` on the document, hence the parts can still be copied and saved.
 * This plugin adds folding triangles on the left margin next to the heading text. 
 * It is invisible until hovered over. Collapsed headings carry a right pointing triangle that is always visible.
 */
export const foldingHeadingPlugin = () => {
   const {tmInit, tmApply, tmDecos} = pluginTiming(pluginName)
   return new Plugin<HeadingState>({
      state: {
         init(_, state) { 
            return tmInit(() => buildHeadingDeco(state))
         },
         apply(tr, pState:HeadingState, oldState, newState:EditorState) { 
            return tmApply(() => {
              
               const meta = tr.getMeta(foldingHeadingPluginKey) as Meta
               if (meta) {    
                  // meta: a heading-expand icon was clicked; --> toggle heading
                  toggleHeading(pState, meta)
                  return buildHeadingDeco(newState, pState)
               } else if (tr.docChanged && hasHeader(tr.selection.$anchor.parent)) {
                  // doc changed and new header in editing paragraph: build new decos:
                  return buildHeadingDeco(newState, pState)
               } else {
                  // no change: simply update positions
                  pState.decoSet.map(tr.mapping, newState.doc)
               }
               return pState
            }
         )},
      },
      props: {
         decorations(state) { return tmDecos(()=>this.getState(state)?.decoSet); },
      },
      key: foldingHeadingPluginKey,
   })
}

function hasHeader(doc: Node):boolean {
   let header = false
   if (doc.type.name === 'heading') return true
   doc.descendants((node: Node) => {
      if (node.type.name === 'heading') {
         header = true
         return false   // stop descending
      }
   })
   return header
}

/** toggle the `isCollapsed` marking on a heading node */
function toggleHeading(pState:HeadingState, meta:Meta) {
   if (meta.level===-1) {
      // hide all, or reveal all
      pState.headingDecos.forEach(deco => {
         (deco as unknown as Node).type.spec.collapsed = (deco as unknown as Node).type.spec.collapsed? false : true
      })
   } else {
      const heading = pState.headings.find(h=> h.title===meta.title && h.level===meta.level)
      if (!heading) log.warn(`not a heading node`)
      else {
         const decoNode = (heading.deco as unknown as Node)
         decoNode.type.spec.collapsed = decoNode.type.spec.collapsed? false : true
      }
   }
}
   
function buildHeadingDeco(state: EditorState, pState?:HeadingState):HeadingState { 
   const headingNodes = findChildren(state.doc, isHeading, false).filter((r) => r.node.content.size > 0)
   const headingDecos:Decoration[] = []
   const hiddenDecos:Decoration[]  = []
   const headings:Heading[]        = []
   headingNodes.map(headingNode => {
      const oldHeadingDeco = pState?.headingDecos.find(deco => deco.from===headingNode.pos+1) 
      const hide = (oldHeadingDeco as unknown as Node)?.type.spec.collapsed? true : false
      const level:number = headingNode.node.attrs.level
      const title:string = headingNode.node.textContent
      const heading:Heading = {level, title, deco: createCollapsibleHeadingDeco(level, title, headingNode.pos, hide)}
      headings.push(heading)
      headingDecos.push(heading.deco)
      if (hide) hiddenDecos.push(...hideHeadingSection(headingNode.node, state.doc))
   })
   const decoSet = DecorationSet.create(state.doc, [...headingDecos, ...hiddenDecos])
   return {headings, headingDecos, decoSet}
}

function createCollapsibleHeadingDeco(level:number, title:string, pos:number, collapsed:boolean):Decoration {
   return Decoration.widget(pos + 1, 
      (view) => createCollapseWidget(view, collapsed, level, title),
      { side: -1, collapsed } // render deco before cursor
   )
}

/** create a heading decoration widget, representing the collapsed state of the heading */
function createCollapseWidget(view: EditorView, isCollapsed: boolean, level: number, title:string) {
   const child = document.createElement(isCollapsed?"marker-collapsed":"marker-expanded");
   child.setAttribute('title', "click: collapse heading\n⌘-click: collapse all")
   child.addEventListener("click", e => { // when clicked, send meta to this plugin:
      view.dispatch(view.state.tr.setMeta(foldingHeadingPluginKey, {title, level:e.metaKey? -1: level}))
   });
   return child;
}

/** 
 * mark nodes in `doc` as `class:hidden`, starting with the node following `node`
 * and ending with the node before a heading of equal or lower level  
 */
function hideHeadingSection(headingNode: Node, doc:Node):Decoration[] {
   const decos: Decoration[] = [];
   let hidden = false;

   doc.descendants((node: Node, pos: number) => {
      if (node === headingNode) {
         // hide all nodes beneath this heading
         hidden = true;
      } else if (hidden) {
         if (isHeading(node) && node.attrs.level <= headingNode.attrs.level) {
            // same or more important heading: no more hiding from here on out
            hidden = false 
         } else if (node.type.name === "listItem" || node.isTextblock) {
            // hide if textblock (heading, paragraph, ...) or listItem
            decos.push(Decoration.node(pos, pos + node.content.size + 2, { class: styles.hidden }));
         } else if (node.type.name === "horizontalRule") {
            // hide if horizontal rule
            decos.push(Decoration.node(pos, pos + node.content.size + 1, { class: styles.hidden }));
         }
      }
   });

   return decos
}
 
