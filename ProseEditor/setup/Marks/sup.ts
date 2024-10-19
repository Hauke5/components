import { MarkDef }            from "../schema"
import { markIsActive, markToggle }       
                              from "./markDefs"
import { markdownMarkRule }   from "../markdown/marks"


const specName    = 'sup'
const tag         = 'sup'
const mdSequence  = '^'

export const sup:MarkDef = {
   specName,
   keys: () => ({ 
      'Mod-^': sup.actions.toggle!
   }),
   actions: {
      isActive:   ()=>markIsActive(specName),
      toggle:     ()=>markToggle(specName),
   },
   pasteRules: [
      /(?:^|\s)((?:\^)((?:[^\^]+))(?:\^))/g   // ^...^
   ],
   inputRules: [
      /(?:^|\s)((?:\^)((?:[^\^]+))(?:\^))$/   // ^...^ at the end of the input line
   ],
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
      where:      {before:'strikethrough'},
      ruleInline: markdownMarkRule(mdSequence, specName, tag),
   }
}
