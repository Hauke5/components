import { MarkDef }                  from "../schema"
import { markIsActive, markToggle } from "./markDefs"


const specName = 'em'

export const italic:MarkDef = {
   specName,
   pasteRules: [
      /\*([^*]+)\*/g,                        // *...*
   ],
   inputRules: [
      /(?:^|\s)((?:\*)((?:[^*]+))(?:\*))$/,  // *...* at the end of the input line
   ],
   keys: () => ({ 
      'Mod-i': italic.actions.toggle!
   }),
   actions: {
      isActive:   ()=>markIsActive(specName),
      toggle:     ()=>markToggle(specName),
   },
   schemaSpec: {
      parseDOM: [
         {tag: 'i'}, 
         {tag: 'em'},
         {style: 'font-style=italic'},
         {
            style: 'font-style=normal', 
            clearMark: m => m.type.name == 'em'
         }
      ],
      toDOM() { return ['em'] } 
   },
   toMarkdown:   {
      open:    '*',
      close:   '*',
      mixable: true,
      expelEnclosingWhitespace: true,
   },
   fromMarkdown: {
      [specName]: {mark: specName}}
}
