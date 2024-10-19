import { MarkDef }      from "../schema"
import { markIsActive, markToggle } 
                        from "./markDefs"


const specName = 's'

export const strike:MarkDef = {
   specName,
   pasteRules: [
      /(?:^|\s)((?:~~)([^~`*^=_]+)(?:~~)(?:$|\W))/g   // ~~...~~
   ],
   inputRules: [
      '~~'
      // /(?:^|\s)((?:~~)([^~`*^=_]+)(?:~~))(?:$|\W)/   // ~~...~~ at the end of the input line
   ],
   keys: () => ({ 
      // 'Mod-d': strong.actions.toggle!
   }),
   actions: {
      isActive:   ()=>markIsActive(specName),
      toggle:     ()=>markToggle(specName),
   },
   schemaSpec: {
      parseDOM: [
         {tag: 'strike'},
         {
            style: 'text-decoration=line-through', 
            clearMark: m => m.type.name == specName
         }
      ],
      toDOM() { return ['strike'] }
   },
   toMarkdown:   {
      open:    '~~',
      close:   '~~',
      mixable: true,
      expelEnclosingWhitespace: true,
   },
   fromMarkdown: {
      [specName]: {mark: specName}}
}
