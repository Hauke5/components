import { MutableRefObject, useEffect, useRef }                
                                 from "react";
import { Node }                  from "prosemirror-model"
import { EditorState, Plugin, PluginKey }           
                                 from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } 
                                 from 'prosemirror-view';
import { getThrottle }           from "@hauke5/lib/utils";
import { pluginTiming }          from "../hooks/useTimings";
import styles                    from "./plugin.module.scss";
import { useProseEditorContext } from "../hooks/useProseEditorContext";


const pluginName  = "wordCountPlugin"
const {tmInit, tmApply, tmDecos} = pluginTiming(pluginName)

// vertical css offsets per header level
const TOPS = [-20,15,10,2,0,0,0]

const wordMatch = (text:string):number => text.match(/\S+/g)?.length ?? 0

export const wordCountPluginKey = new PluginKey<WordCountState>(pluginName)


type WordCountState = {
   decoSpecs:  DecoSpec[]
   showCounts: boolean
}

type DecoSpec = {
   pos:           number
   words:         string|(()=>string)
   headingLevel?: number;
}
type ParagraphSpec = {
   words:   number
   pos:     number
   level?:  number
}

type WordCountProps = {
   show?:      boolean
   className?: string
}
/**
 * adds a decoration on the right margin of each paragraph showing a live count of the number of words in the paragraph.
 * Headings will show the sum of all words in themselves and all text blocks up to the next heading of the same level
 * The total number of words in the document will be displayed at the top right of the page
 * ### Parameters:
 * - show (default: `true`): shows or hides the word count 
 * - className: a `css` class to apply to the decorations
 */
export const wordCountPlugin = ({show=true, className}:WordCountProps) => {
   const decoClass = `${styles.wordcount} ${className??''}`
   let decoSet:   DecorationSet     // can't be in state b/c it is updated asynchronously in `throttle`
   let decoSpecs: DecoSpec[]
   let view:      EditorView
   let showCounts = show
   const throttle = getThrottle({pace:1000})

   return new Plugin<WordCountState>({
      state: {
         init(_, state) { 
            return tmInit(()=> {
               const counts = wordCountDeco(state.doc, decoClass)
               decoSet = DecorationSet.create(state.doc, counts.decos)
               decoSpecs = counts.decoSpecs
               return {decoSpecs, showCounts}
            })
         },
         apply(tr, old, oldState, newState:EditorState) { 
            return tmApply(() => {
               const meta = tr.getMeta(wordCountPluginKey) as boolean
               if (typeof meta === 'boolean')showCounts = meta
               if (!tr.docChanged) {
                  // simply move existing decos
                  decoSet = decoSet.map(tr.mapping, newState.doc)
               } else throttle(`wordCount`, false, async () => {
                  // recreate the decos
                  const counts = wordCountDeco(newState.doc, decoClass)
                  decoSet = DecorationSet.create(newState.doc, counts.decos)
                  decoSpecs = counts.decoSpecs
                  if (view) view.dispatch(view.state.tr)
               })
               return {showCounts, decoSpecs}
            })
         }
      },
      props: {
         decorations(state) {
            return tmDecos(()=> this.getState(state)?.showCounts? decoSet : DecorationSet.empty)
         }
      },
      view: (v) => {
         view = v
         return {}
      },
      key: wordCountPluginKey,
   })
   
   
   function wordCountDeco(node:Node, className:string):{decos:Decoration[], decoSpecs:DecoSpec[]}  {
      const decoSpecs = countWords(node)
      const decos = decoSpecs.map((deco:DecoSpec) => Decoration.widget(deco.pos, createDiv(deco, className)))
      return {decos, decoSpecs}
   }
}

export function useWordCountRule() {
   const {currentView} = useProseEditorContext()
   const words = useRef('0')
   const wordCountRule   = useRef(createWordCountRule(words))
   useEffect(()=>{
      const state = currentView? wordCountPluginKey.getState(currentView.state)?.decoSpecs : [] as DecoSpec[]
      words.current = state?.[0]?.words as string ?? '-1'
   }, [currentView])
   return wordCountRule.current
}

function createWordCountRule(words:MutableRefObject<string>) {
   return {
      wordCount: {
         text:    () => words.current,
         comment: 'number of words in the document',
      }
   }
}


function createDiv(deco:DecoSpec, className:string) {
   let div = document.createElement("div")
   div.textContent = typeof deco.words==='function'? deco.words() : deco.words;
   if (deco.headingLevel!==undefined) {
      div.className = `${className} hdg${deco.headingLevel}`;
      (div as any).style = `
         ${deco.headingLevel===0?'color:#8a8;':''}
         text-decoration: underline;
         transform: translate(0, ${TOPS[deco.headingLevel]}px);
      `   
   } else {
      div.className = `${className} par`;
   }
   return div
}

function countWords(doc: Node):DecoSpec[]  {
   const paragraphs:ParagraphSpec[] = []

   // For each node in the document
   doc.descendants(getCounts)
   return aggregateCounts(paragraphs)

   function getCounts(node: Node, pos: number) {
      if (node.isTextblock && (node.content as any).content[0]) {
         const words = (node.content as any).content.reduce((acc:number, c:any) =>
            acc + wordMatch(c?.text ?? ''), 0); 
         const spec:ParagraphSpec = {pos:pos+1, words}
         if (node.type.name === 'heading') spec.level = node.attrs.level
         paragraphs.push(spec)
      }
   }

   interface Aggregate {
      words:   {words:number}
      pos:     number
      level?:  number
   }
   function aggregateCounts(paragraphs:ParagraphSpec[]):DecoSpec[] {
      const h = [{words:0}];   
      let currParentLevel = 0
      const aggregates:Aggregate[] = paragraphs.map(p => {
         const aggr:Aggregate = { words: {words:p.words}, pos:p.pos}
         if (p.level) {
            if (p.level === currParentLevel) h[p.level] = aggr.words = {words:0}
            if (p.level > currParentLevel) 
               for (let l=currParentLevel+1; l<=p.level; l++) h[l] = aggr.words = {words:0}
            currParentLevel = p.level
            aggr.level = p.level
         }
         for (let l=0; l<=currParentLevel; l++) h[l].words += p.words
         return aggr
      })
      aggregates.unshift({
         words:{words:h[0].words}, pos:0, level:0
      })
      return aggregates.map(a => ({
         words:`${a.words.words}`, pos:a.pos, headingLevel:a.level
      }))
   }
}





