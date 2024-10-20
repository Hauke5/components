import { MutableRefObject, useRef }                
                                 from "react"
import { useEditorContext } from "./useEditorContext"
import { EditorView }            from "../Editor"


/**
 * Returns a reference to the current editor view, i.e. the view that currently has the focus. 
 * Use `viewRef.current` to get the view itself.
 * Using a reference helps avoid a common trap when using a stale view within a closure in the calling component.
 */
export function useCurrentEditorViewRef():MutableRefObject<EditorView | null> {
   const {currentView} = useEditorContext()
   const view = useRef<EditorView|null>(currentView)
   view.current = currentView
   return view
}