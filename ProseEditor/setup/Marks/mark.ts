import { MarkDef }            from "../schema"
import { markdownMarkRule }   from "../markdown/marks"
import { markIsActive, markToggle } 
                              from "./markDefs"


const specName    = 'mark'
const tag         = 'mark'
const mdSequence  = '=='

export const mark:MarkDef = {
   specName,
   pasteRules: [
      /(?:^|\s)((?:==)((?:[^=]+))(?:==))/g   // ==...==
   ],
   inputRules: [
      /(?:^|\s)((?:==)((?:[^=]+))(?:==))$/   // ==...== at the end of the input line
   ],
   keys: () => ({ 
      'Mod-=': mark.actions.toggle!
   }),
   actions: {
      isActive:   ()=>markIsActive(specName),
      toggle:     ()=>markToggle(specName),
   },
   schemaSpec: {
      parseDOM: [{tag}],
      toDOM() { return [tag] }
   },
   toMarkdown:{
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
      where:      {before:'strikethrough'},
      ruleInline: markdownMarkRule(mdSequence, specName, tag),
   }
}
