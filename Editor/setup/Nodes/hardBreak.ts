import { chainCommands, exitCode }  from "prosemirror-commands"
import { Node }                     from "prosemirror-model"
import { MarkdownSerializerState }  from 'prosemirror-markdown'
import { Action, GenericActions, NodeDef }  
                                    from "../schema"


const specName = 'hardBreak'

const breakCmd = ()=>chainCommands(exitCode, (state, dispatch) => {
      const type = state.schema.nodes.hardBreak
      if (dispatch) dispatch(state.tr.replaceSelectionWith(type.create()).scrollIntoView())
      return true
   })

export const hardBreak:NodeDef<BreakActions> = {
   specName,
   pasteRules: [],
   inputRules: [],
   keys: () => ({ 
      'Shift-Enter':         hardBreak.actions.break,
   }),
   actions: {
      break:   breakCmd,
   },
   schemaSpec: {
      inline:        true,
      group:         'inline',
      selectable:    false,
      parseDOM:      [{tag: 'br'}],
      toDOM() { return ['br'] }
   },
   toMarkdown: (state:MarkdownSerializerState, node:Node, parent:Node, index:number) =>{
      for (let i = index + 1; i < parent.childCount; i++) {
         if (parent.child(i).type !== node.type) {
            state.write('\\\n');
            return;
         }
      }
   },
   fromMarkdown: {
      [specName]: { node: specName },
   },
}

type BreakActions = GenericActions & {
   break:   Action
}