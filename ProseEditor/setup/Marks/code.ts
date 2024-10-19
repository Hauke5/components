import { Node }                     from "prosemirror-model";
import { MarkDef }                  from "../schema"
import { markIsActive, markToggle } from "./markDefs";


const specName = 'code_inline'   // term used in `from_markdown.noCloseToken`
const BEFORE = false
const AFTER  = true

export const code:MarkDef = {
   specName,
   keys: () => ({ 
      'Alt-`': code.actions.toggle!
   }),
   actions: {
      isActive:   ()=>markIsActive(specName),
      toggle:     ()=>markToggle(specName),
   },
   pasteRules: [
      /(?:`)([^`]+)(?:`)/g,   // '`'
   ],
   inputRules: [
      /(?:`)([^`]+)(?:`)$/,   // '`' at the end of the input line
   ],
   schemaSpec: {
      parseDOM: [{tag: 'code'}],
      toDOM() { return ['code'] }
   },
   toMarkdown: {
      open:  (_state, _mark, parent, index) => backticksFor(parent.child(index),    BEFORE),
      close: (_state, _mark, parent, index) => backticksFor(parent.child(index - 1), AFTER),
      escape: false,
   },
   fromMarkdown: {
      [specName]: { 
         mark: specName, 
         noCloseToken: true 
      },
   },
}



function backticksFor(node: Node, after: boolean) {
   const ticks = /`+/g
   let m: RegExpExecArray | null
   let len = 0
   while (node.isText && (m = ticks.exec(node.text!))) {
      if (typeof m[0] === 'string') len = Math.max(len,  m[0].length);
   }
   let result = len > 0 && after ? ' `' : '`'
   for (let i=0; i<len; i++) { result += '`' }
   if (len>0 && !after) result += ' '
   return result;
}
