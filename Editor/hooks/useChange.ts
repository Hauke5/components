import { Log }                      from "@hauke5/lib/utils";
import { EditorView }               from "../Editor"
import { changedContentKey, changedSelectionKey } 
                                    from "../plugins/changedPlugin";
import { usePluginState }           from "./usePluginState";
import { useCurrentEditorViewRef }  from "./useCurrentEditorView";


const log = Log('useContentChange')

/** 
 * triggers a redraw when the active document changes.
 * If no `view` is provided, 
 */
export function useContentChange(view:EditorView|null):string|null {
   const viewRef = useCurrentEditorViewRef()
   const state = usePluginState(changedContentKey, view ?? viewRef.current)
   log.debug(`render, content state='${state}' refView=${viewRef.current?.__myID} view=${(view ??= viewRef.current)?.__myID}`)
   return state
}

/** triggers a redraw when the active document changes */
export function useSelectionChange(view:EditorView|null):string   {
   const viewRef = useCurrentEditorViewRef()
   const state = usePluginState(changedSelectionKey, view ?? viewRef.current)
   log.debug(`useSelectionChange, content state=${state} view=${(view ?? viewRef.current)?.__myID}`)
   return state
}
