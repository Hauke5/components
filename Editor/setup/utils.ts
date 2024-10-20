import { Command, EditorState, Selection } 
                        from "prosemirror-state";
import { EditorView }   from "prosemirror-view";


/**
 * From Prosemirror https://github.com/prosemirror/prosemirror-markdown/blob/6107527995873d6199bc533a753b614378747056/src/to_markdown.ts#L380
 * Tries to wrap the string with `"` if it doesn't contain a '"', else if `'` if it has no `'`. else `()`
 */
export const quote = (str: string) => 
   str.indexOf('"') === -1 ? `"${str}"` : str.indexOf("'") === -1 ? `'${str}'`: `(${str})`


export type CommandQuery = (state: EditorState, view?: EditorView) => boolean;


/**
 * ensures that all predicates are `true`, then calls `cmd`. Otherwise, returns `false`
 */
export function conditionalCommand(predicates:CommandQuery[], cmd: Command): Command {
   return (state, dispatch, view) => {
      if (predicates.some((pred) => !pred(state, view))) return false
      return cmd(state, dispatch, view)
   };
}


export function scrollToPos(view:EditorView, pos:number) {
   const maxPos = view.state.doc.content.size
   const endSelect = Selection.findFrom(view.state.doc.resolve(maxPos), -1)
   const posSelect = Selection.findFrom(view.state.doc.resolve(Math.min(maxPos, pos)), 1)
   if (endSelect && posSelect) {
      // scroll to end of document
      view.dispatch(view.state.tr.setSelection(endSelect).scrollIntoView())
      // then scroll back up to have target pos in view and at the top of page
      view.dispatch(view.state.tr.setSelection(posSelect).scrollIntoView())
   }
}