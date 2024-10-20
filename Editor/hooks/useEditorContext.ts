import { Log }          from "@hauke5/lib/utils"
import { useContext }   from "react"
import { EditorContext, editorContext }   
                        from "../EditorContext"

const log = Log(`useEditorContext`)
/** 
 * ## useEditorContext
 * provides the hooks to use `EditorContext` in an app.
 * ### Hook usage: Create a `Editor`
 * ```
 * function Component() {
 *    const view                   = useRef<EditorView>()
 *    const {currentView, addView} = useEditorContext()
 *    const appPlugins             = useRef(createPlugins())
 *    return <Card>
 *       <Scrollable className={`${styles.narrative}`} >
 *          <Editor className={styles.page} newView={(newView:EditorView)=>view.current = newView} plugins={appPlugins.current}/>
 *       </Scrollable>
 *    </Card>
 * }
 * ```
 * ### Hook usage: Creating a `EditorMenu`
 * ```
 * function AppMenuBar() {
 *    const {currentView} = useEditorContext()
 *    return <EditorMenu view={currentView} className={styles.menu}/>
 * }
 * ```
 * see {@link EditorContext}
 */
export function useEditorContext():EditorContext {
   const context = useContext(editorContext)
   if (!context) {
      log.warn('useProsemirrorContext is called outside the context. A dummy context will be provided. ' +
               'If this is unintentional, define a `ProsemirrorContext` in the calling app.')
      console.trace()
      return {
         currentView:   null,
         views:         [],
         addView:       () => undefined,
         removeView:    () => undefined,
      }
   }
   return context
}
