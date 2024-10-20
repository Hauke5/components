import { MarkDef }            from "../schema"
import { markIsActive, markToggle }       
                              from "./markDefs"
import { markdownMarkRule }   from "../markdown/marks"


const specName    = 'sub'
const tag         = 'sub'
const mdSequence  = '~'

export const sub:MarkDef = {
   specName,
   pasteRules: [
      /(?:^|\s)((?:~)((?:[^~]+))(?:~))/g   // ~...~
   ],
   inputRules: [
      /(?:^|\s)((?:~)((?:[^~]+))(?:~))$/   // ~...~ at the end of the input line
   ],
   keys: () => ({ 
      'Mod-~': sub.actions.toggle!
   }),
   actions: {
      isActive:   ()=>markIsActive(specName),
      toggle:     ()=>markToggle(specName),
   },
   schemaSpec: {
      parseDOM: [{tag}],
      toDOM() { return [tag] }
   },
   toMarkdown:   {
      open:    mdSequence,
      close:   mdSequence,
      mixable: true,
      expelEnclosingWhitespace: true,
   },
   fromMarkdown: {
      [specName]: {mark: specName}
   },
   markdownItPlugin: {
      ruleName:   specName,
      where:      {after:'strikethrough'},
      ruleInline: markdownMarkRule(mdSequence, specName, tag),
   }
}
