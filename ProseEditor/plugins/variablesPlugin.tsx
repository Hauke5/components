/**
 * ## variablesPlugin
 * searches the document for words enclosed with `%` and and replaces them with dynamic content.
 * Available variable keywords are:
 * - `time`: current time as "%H:%M:%S"
 * - `date`: current date as "%Y.%m.%d"
 * - `week`: current week of the year
 * - `filename`: the name of the current file on disk
 * @module
 */
import { Fragment, ReactNode, useRef }       
                        from "react"
import { Root, createRoot }      
                        from "react-dom/client"
import { Node }         from "prosemirror-model"
import { Plugin, PluginKey }          
                        from "prosemirror-state"
import { Decoration, DecorationSet } 
                        from "prosemirror-view"
import { Log }          from "@hauke5/lib/utils"
import { pluginTiming } from "../hooks/useTimings"
import styles           from './plugin.module.scss'

const log = Log(`variablesPlugin`)

//                %<var name>%
// const varMatch = /(?:^|\s)(%([a-zA-Z0-9_-]+)%)(?:\W|$)/g;
//                {:<var name>}
const VarOpen = '{:'
const VarClose = '}'
const varMatch = new RegExp(`(?:^|\s)(${VarOpen}([a-zA-Z0-9_-]+)${VarClose})(?:\W|$)`,'g')

const pluginKey = "variablesPlugin";
const {tmInit, tmApply, tmDecos} = pluginTiming(pluginKey)

export type VariableDefs = {
   [varName:string]: VarValueFn
}

export type VarValueFn = { 
   text:    ()=>ReactNode
   comment: string
}

type Replacement = {
   root:       Root
   elem:       HTMLElement
   content:    ()=>ReactNode
   pos:        number
   width:      number
}

type VariablesPluginProps = {
   replacements:  Replacement[]
   decoSet:       DecorationSet
}

/**
 * A plugin that manages a set of variables, as per their rule definitions.
 * Variables can be placed in the document by bracing a `rule name` as `{:<rule name>}`,
 * which will be replaced with an up-to-date variable content.
 */
export const variablesPlugin = (defs:VariableDefs) => {
   // add help text
   defs.help = getHelp(defs)

   return new Plugin<VariablesPluginProps>({
      state: {
         init(_, state) { 
            return tmInit(()=> {
               const replacements:Replacement[] = constructReplacements(state.doc, defs)
               const decoSet = constructDecoSet(state.doc, replacements)
               return {decoSet, replacements}
            })
         },
         apply(tr, pState, oldState, newState) {
            return tmApply(()=>{
               let replacements = pState.replacements
               let decoSet = pState.decoSet
               if (tr.docChanged) {
                  if (hasVariableDef(tr.selection.$anchor.parent)) {
                     // editing a variable: recreate variable replacements
                     replacements = constructReplacements(newState.doc, defs)
                  } else {
                     // not editing a variable: map replacements
                     replacements.forEach(r => r.pos = tr.mapping.map(r.pos))
                  }
               } else {
                  // no change: simply update positions
                  replacements.forEach(r => r.pos = tr.mapping.map(r.pos))
               }
               decoSet = constructDecoSet(newState.doc, replacements)
               return {decoSet, replacements}
            })
         },
      },
      props: {
         decorations(state) { 
            return tmDecos(()=> {
               return this.getState(state)?.decoSet ?? DecorationSet.empty
            })
         },
      },
      key: new PluginKey(pluginKey),
   });
};

function constructReplacements(doc:Node, defs:VariableDefs):Replacement[] {
   return findVariableTags(doc, defs).map(r => {
      const {root, elem} = varElem(r.varValueFn.comment)
      return {
         root, elem,       
         pos:        r.pos,
         width:      r.width,
         content:    r.varValueFn.text,
      } as Replacement
   }) 
}

function constructDecoSet(doc:Node, replacements:Replacement[]):DecorationSet {
   // add decoration to 'hide' each tag
   const hideDecos = replacements.map(r=>Decoration.inline(r.pos, r.pos + r.width, {nodeName: "var-anchor"}))
   // add the variable replacement as Decoration
   const replDecos = replacements.map(r=>{
      r.root.render(r.content())
      return Decoration.widget(r.pos, r.elem)
   })
   return DecorationSet.create(doc, [...hideDecos, ...replDecos])
}

function hasVariableDef(doc: Node): boolean {
   let hasMatch = false
   doc.descendants((node: Node, pos: number) => {
      if (node.isText) {
         const matches = Array.from(node.text?.matchAll(varMatch) ?? [])
         hasMatch = hasMatch || matches.length>0
         if (hasMatch) return false // don't descend further
      }
   });
   return hasMatch;
}


/**
 * find all `{:<tag>}` anchors, substitute them for variables, if a match, else thighlight them and make them clickable.
 * @param doc
 * @returns
 */
function findVariableTags(doc: Node, defs:VariableDefs):Match[] {
   const matches:Match[] = []
   doc.descendants((node: Node, pos: number) => {
      if (node.isText) {
         const m = variableMatches(node, pos, defs);
         matches.push(...m)
      }
   });
   return matches;
}

type Match = {
   pos         : number
   width       : number
   varValueFn  : VarValueFn
}

function variableMatches(c:Node, rel: number, defs:VariableDefs):Match[] {
   const varMatches:Match[] = []
   // find all {:***} fields
   const matches = [...(c.text?.matchAll(varMatch) ?? [])]
   for (const match of matches) {
      const varValueFn = defs[match[2]]
      if (varValueFn && match.index!==undefined) {
         const pos = rel + match.index + match[0].indexOf(match[1])
         const width = match[1].length
         const repl:Match = {pos, varValueFn, width}
         varMatches.push(repl)
      }
   }
   return varMatches
}

function varElem(comment:string) {
   let elem = document.createElement("var-value");
   const root = createRoot(elem) 
   elem.title = comment
   return {root, elem}
}

function getHelp(defs:VariableDefs) {
   return ({
      text: () => <>
         <div className={styles.variables}>
            <b>Variable </b>
            <b>Comment</b>
            <b>Current Value</b>
            {Object.keys(defs).map(k=>k!=='help' && <Fragment key={k}>
               <span>{`${VarOpen}${k}${VarClose} :`}</span>
               <span>{defs[k].comment}</span>
               <span>{defs[k].text()}</span>
            </Fragment>)}
         </div>
      </>,
      comment: `prints a list of available variable names.\nEnclose a variable with '%' signs, e.g. %help%`
   })
}



export function useVariableRules():{[name:string]:VarValueFn} {
   const varRules = useRef(getVarRules())
   return varRules.current
}

function getVarRules() {
   const time:VarValueFn = ({
      text:    () => timeFormat.format(new Date()),
      comment: `the time of last edit`
   })
   const date:VarValueFn = ({
      text:    () => dateFormat.format(new Date()),
      comment: `the date of last edit`
   })
   return {time, date}
}


const dateFormat = {
   format: (date:Date) => `${date.getFullYear()}${`${date.getMonth()+1}`.padStart(2,'0')}${`${date.getDate()}`.padStart(2,'0')}`
}

const timeFormat = {
   format: (date:Date) => `${`${date.getHours()}`.padStart(2,'0')}:${`${date.getMinutes()}`.padStart(2,'0')}:${`${date.getSeconds()}`.padStart(2,'0')}`
}
