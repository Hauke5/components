import { MutableRefObject, useEffect, useRef } 
                                    from "react";
import { Node }                     from "prosemirror-model";
import { Plugin, PluginKey, EditorState, Selection } 
                                    from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } 
                                    from "prosemirror-view";
import { Log }                      from "@hauke5/lib/utils";
import { pluginTiming }             from "../hooks/useTimings";
import { useCurrentEditorViewRef }  from "../hooks/useCurrentEditorView";
import { scrollToPos }              from "../setup/utils";
import styles                       from './plugin.module.scss'

const pluginName = "tocPlugin"
export const TOCPluginKey = new PluginKey<TocPluginState>(pluginName)

const {tmInit, tmApply, tmDecos} = pluginTiming(pluginName)

const log = Log(`tocPlugin`)

export interface TOCSStateEntry {
   id:      string, 
   level:   number,
   text:    string,
   deco?:   Decoration,
   pos:     number
}
export interface TocPluginState {
   entries: TOCSStateEntry[]
   set:     DecorationSet     // decos to add id tags to heading nodes
} 

export type TOCState = TOCSStateEntry[]

/**
 * A plugin that maintains a Table of Content for the current document by listing the hierarchy of headings.
 * The plugin ensures that each heading in the document has a valid `id` and  `title` attribute, generating them when needed.
 * Use the `vaiablesPlugin` with the `tocRule` returned by `useTOCRule` to actually display a ToC in the document
 * by adding the variable reference `{:toc}` to the document
 */
export const tocPlugin = () => new Plugin<TocPluginState>({
   key: TOCPluginKey,
   state: {
      init(_, state) { 
         return tmInit<TocPluginState>(() => {
            const {entries, set} = updateTOC(state)
            return {entries, set}
         })
      },
      apply(tr, old, oldState, newState) { 
         return tmApply<TocPluginState>(() => {
            let entries = old.entries
            let set = old.set
            if (tr.docChanged && hasHeader(tr.selection.$anchor.parent)) {
               return updateTOC(newState)
            }
            set = set.map(tr.mapping, newState.doc)
            entries.forEach(entry => {
               entry.pos = tr.mapping.map(entry.pos)
            })
            return {entries, set}
         })
      },
   },
   props: {
      decorations(state) { return tmDecos(() => {
         const pluginState = this.getState(state)
         return pluginState?.set
      })},
   }
});


/** returns a new `TocPluginState`  */
function updateTOC(state:EditorState):TocPluginState {
   const entries = buildTOC(state.doc)
   const set = DecorationSet.create(state.doc, entries?.map(toc => toc.deco).filter(deco=>deco) as Decoration[])
   return {entries, set}
}

function hasHeader(node: Node):boolean {
   let header = false
   if (node.type.name === 'heading') return true
   node.descendants((node: Node, pos: number) => {
      if (node.type.name === 'heading') header = true
   })
   return header
}

/** generates `id` decorations for the document that can be linked to from the TOC */
function buildTOC(doc: Node):TOCState {
   const result:TOCState = []
   doc.descendants((node: Node, pos: number) => {
      if (node.type.name === 'heading') {
         const headingText = (node.content as any).content.reduce((acc:number, c:any) => `${acc}${(c.text ?? '')}`, ''); 
         const id = node.attrs.id ?? getTextID(headingText)     // getUniqueID()   // `a${pos}`
         const title = id
         const resolved = doc.resolve(pos)
         const entry:TOCSStateEntry = {id, level:node.attrs.level, text:headingText, pos:resolved.parentOffset}
         result.push(entry)
         entry.deco = Decoration.node(pos, pos+headingText.length+2, {id, title})
      }
   })
   return result
}

function getUniqueID() {
   // const id = crypto.randomUUID()
   const id = `${Math.random().toString(36).slice(2, 6)}`
   return id
}

function getTextID(text:string) {
   return text.trim().replaceAll(/\W/g, '_')
}





/**
 * A hook that returns a `variable` rule to generate the TOC for the current doc.
 * This rule is meant to be used with the `variablePlugin` when creating the Editor plugins.
 * When its `text()` function is called, it created the Table of Contents for each heading in the document,
 * as retrieved from the state of the `tocPlugin`
 */
export function useTOCRule() {
   const viewRef  = useCurrentEditorViewRef()
   const tocRule  = useRef({toc: createTocRule(viewRef)})

   useEffect(() => {
      if (viewRef.current) {
         viewRef.current.dispatch(viewRef.current.state.tr)
      }
   }, [viewRef, viewRef.current?.__myID])
   
   return tocRule.current
}

/** 
 * creates the TOC when `text()` is called. This happens inside the `variablesPlugin`,
 * hence the `tocState` needs to be extracted inside this function and we need to pass in the view reference
 */
function createTocRule(viewRef:MutableRefObject<EditorView | null>) {
   return {
      text: ():JSX.Element => {
         const h = [0,0,0,0,0,0]
         const tocState = viewRef.current? TOCPluginKey.getState(viewRef.current.state)?.entries : [] as TOCSStateEntry[]
         if (!tocState) return <div></div>
         return <div className={styles.toc}>
            {tocState.map(entry => {
               h[entry.level-1]++
               const pre = h.slice(0, entry.level).join('.')
               return <div onClick={scrollTo} className={styles.row} key={`${entry.level}_${entry.text}`}>
                  <span>{`${pre}:`}</span>
                  <span>{`${entry.text}`}</span>
               </div>

               function scrollTo() {
                  const v = viewRef.current
                  if (v) scrollToPos(v, entry.pos)
               }
         })}
         </div>
      },
      comment: 'inserts a table of content'
   }
}
