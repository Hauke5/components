import { Command, Plugin } from 'prosemirror-state';
import { ellipsis, InputRule, inputRules, smartQuotes }       
                           from 'prosemirror-inputrules';
import {Attrs, MarkSpec, MarkType, NodeSpec, NodeType, Schema}      
                           from 'prosemirror-model'
import { dropCursor }      from 'prosemirror-dropcursor';
import { gapCursor }       from 'prosemirror-gapcursor';
import { history }         from 'prosemirror-history';
import { keymap }          from 'prosemirror-keymap';
import OrderedMap          from 'orderedmap';
import { markRules, code, italic, strike, strong, link, sup, sub, mark, underline } 
                           from './Marks';
import { nodeRules, blockQuote, bulletList, code_block, doc, hardBreak, heading, 
         horizontal_rule, image, listItem, orderedList, paragraph, text, todoList} 
                           from './Nodes';
import { MarkdownPlugin, MarkdownSpec, MarkSerializerSpec, NodeSerializerSpec }    
                           from './markdown/markdown';
import { buildKeymap }     from './keymap';


export type SchemaSpec<T extends MarkSpec|NodeSpec> = {
   specName:      string,
   schemaSpec:    T 
}

export type Action = (attr?:any) => Command
export type GenericActions = {[actionName:string]: Action}
export type Actions<ACTIONS extends GenericActions> = ACTIONS
export type MarkActions = GenericActions & {
   isActive:   Action
   toggle?:    Action
}
export type NodeActions = GenericActions & {
   isActive:   Action 
   toggle?:    Action 
   wrapIn?:    Action
}
export type ActionsSpec<ACTIONS extends {[actionName:string]: Action } = {}> = {
   specName:   string
   /** maps key strokes to action names */
   keys?:   () => {[keyStroke:string]: Action}
   /** maps action names to `Commands` */
   actions: Actions<ACTIONS>
}

export type MarkDef<ACTIONS extends GenericActions=MarkActions> = SchemaSpec<MarkSpec> & BindingRules<ACTIONS> & MarkdownPlugin & MarkdownSpec<MarkSerializerSpec> 
export type NodeDef<ACTIONS extends GenericActions=GenericActions> = SchemaSpec<NodeSpec> & BindingRules<ACTIONS> & MarkdownPlugin & MarkdownSpec<NodeSerializerSpec> 

export type CommandBinding = (defType:MarkType|NodeType, attrs?: Attrs|null)=>Command
export type RuleBinding    = (defType:MarkType|NodeType, attrs?: Attrs|null)=> InputRule
export type PluginBinding   = (defType:MarkType|NodeType, attrs?: Attrs|null)=> Plugin

export type BindingRules<ACTIONS extends {[actionName:string]: Action } = {}> = ActionsSpec<ACTIONS> & {
   specName:      string
   /**
    * rules for processing pasted markdown content.
    * if the rule is a `RegExp` (for Marks only), it is
    * expected to produce at least one capturing group (i.e. the match array as at least two-elements), with: 
    * - second-last match (which can be element 0, the entire expression): 
    * The Mark, including surrounding markdown characters, e.g. '**<content>**'
    * - last match (i.e. element 1 or higher): The text of the mark, i.e. '<content>'
    */
   pasteRules?:   (string|RegExp|PluginBinding)[]
   /**
    * rules for processing typed markdown content.
    * if the rule is a `RegExp` (for Marks only), it is
    * expected to produce at least one capturing group (i.e. the match array as at least two-elements), with: 
    * - second-last match (which can be element 0, the entire expression): 
    * The Mark, including surrounding markdown characters, e.g. '**<content>**'
    * - last match (i.e. element 1 or higher): The text of the mark, i.e. '<content>'
    */
   inputRules?:   (string|RegExp|RuleBinding)[]

   /** 
    * addes a `prosemirror` plugin to render the view.  
    * This is useful when rendering new nodes definitions in `markdown-it` (via the `markdownItPlugin` option)
    */
   nodeViewPlugins?: (()=>Plugin)[]
   // /** 
   //  * a set of `Command` bindings the mark supports. 
   //  * These will be called by events, e.g. via a menu,
   //  * or an optional key combination
   //  */
   // bindings:   { 
   //    [name:string]: {
   //       binding: CommandBinding
   //       key?:    string, 
   //    }
   // },
}

                     
export const markDefs = [
   italic, strong, link, code, strike, sup, sub, mark, underline
]

export const nodeDefs = [
   doc, paragraph, blockQuote, horizontal_rule, heading, code_block, 
   orderedList, bulletList, todoList, listItem, text, image, hardBreak
]


export const marks = {
   italic, strong, link, code, strike, sup, sub, mark, underline
}
export const nodes = {
   doc, paragraph, blockQuote, horizontal_rule, heading, code_block, 
   orderedList, bulletList, todoList, listItem, text, image, hardBreak
}

export const schema = new Schema({
   nodes: OrderedMap.from(Object.fromEntries(nodeDefs.map((node:NodeSpec) => [node.specName, node.schemaSpec]))), 
   marks: OrderedMap.from(Object.fromEntries(markDefs.map((mark:MarkSpec) => [mark.specName, mark.schemaSpec])))
})



export function schemaPlugins(schema:Schema):Plugin[] {
   return [
      ...coreRules(schema),
      ...markRules(markDefs, schema),
      ...nodeRules(nodeDefs, schema),
   ]
}

function coreRules(schema:Schema):Plugin[] {
   const coreKeyMap = buildKeymap(schema)
   return [
      inputRules({rules:[
         ...smartQuotes, 
         ellipsis,
         // new InputRule(/--$/, "—"),    // emDash
      ]}),
      keymap(coreKeyMap),
      dropCursor(),
      gapCursor(),
      history()
   ]
}