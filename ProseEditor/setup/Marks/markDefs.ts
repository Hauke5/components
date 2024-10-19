import { toggleMark }   from "prosemirror-commands"
import { Command, EditorState, Transaction }   
                        from 'prosemirror-state'
import { EditorView }   from "prosemirror-view";



export function markIsActive(specName:string):Command {
   return (state:EditorState) => {
      const mark = state.schema.marks[specName]
      const { from, $from, to, empty } = state.selection
      if (empty) return Boolean(mark.isInSet(state.tr.storedMarks || $from.marks()))
      return Boolean(state.doc.rangeHasMark(from, to, mark))
   }
}
                                          
export function markToggle(specName:string):Command {
   return (state:EditorState, dispatch?: (tr:Transaction)=>void, view?:EditorView) => {
      const mark = state.schema.marks[specName]
      return toggleMark(mark)(state, dispatch, view)
   }
}

export function selectedText(state:EditorState):string {
   const { from, to } = state.selection
   return state.doc.textBetween(from, to)
}
                                          
