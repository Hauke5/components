import { MarkDef }      from "../schema"
import { markIsActive, markToggle } 
                        from "./markDefs"


const specName = 'strong'

export const strong:MarkDef = {
   specName,
   pasteRules: [
      /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))/g,    // **...**
      /(?:^|\s)((?:__)((?:[^__]+))(?:__))/g        // __...__
   ],
   inputRules: [
      // /(?:^|\s)((?:__)((?:[^__]+))(?:__))$/,       // __...__ at the end of the input line
      // /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))$/,    // **...** at the end of the input line
      '\\*\\*'
   ],
   keys: () => ({ 
      'Mod-b': strong.actions.toggle!
   }),
   actions: {
      isActive:   ()=>markIsActive(specName),
      toggle:     ()=>markToggle(specName),
   },
   schemaSpec: {
      parseDOM: [
         {tag: 'strong'},
         {
            tag: 'b', 
            getAttrs: node => node.style.fontWeight != 'normal' && null
         },{
            style: 'font-weight=400', 
            clearMark: m => m.type.name == specName
         },{
            style: 'font-weight', 
            getAttrs: value => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null
         }
      ],
      toDOM() { return ['strong'] }
   },
   toMarkdown:   {
      open:    '**',
      close:   '**',
      mixable: true,
      expelEnclosingWhitespace: true,
   },
   fromMarkdown: {
      [specName]: {mark: specName}}
}
