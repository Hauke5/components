import { markdownMarkRule }   from "../markdown/marks"
import { MarkDef }            from "../schema"
import { markIsActive, markToggle }       
                              from "./markDefs"


const specName    = 'underline'
const tag         = 'u'
const mdSequence  = '_'

export const underline:MarkDef = {
   specName,
   keys: () => ({ 
      'Mod-u': underline.actions.toggle!
   }),
   actions: {
      isActive:   ()=>markIsActive(specName),
      toggle:     ()=>markToggle(specName),
   },
   pasteRules: [
      /(?:^|\s)((?:_)([^_]+)(?:_)(?:$|\W))/g   // _..._
   ],
   inputRules: [
      /(?:^|\s)((?:_)((?:.+))(?:_))(?:\W)$/   // _..._ at the end of the input line
   ],
   schemaSpec: {
      parseDOM: [
         {tag},
         {
            style: 'text-decoration',
            getAttrs: (value: any) => value === specName && null,
         },
      ],
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
      where:      {before:'emphasis'},
      ruleInline: markdownMarkRule(mdSequence, specName, tag),
   }
}
