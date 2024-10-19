import { Log }          from "@hauke5/lib/utils"
import { useContext }   from "react"
import { ProseEditorContext, proseEditorContext }   
                        from "../ProseEditorContext"

const log = Log(`useProseEditorContextNew`)
/** 
 * ## useProseEditorContext
 * provides the hooks to use `ProseEditorContext` in an app.
 * ### Hook usage: Create a `ProseEditor`
 * ```
 * function Component() {
 *    const view                   = useRef<EditorView>()
 *    const {currentView, addView} = useProseEditorContext()
 *    const appPlugins             = useRef(createPlugins())
 *    return <Card>
 *       <Scrollable className={`${styles.narrative}`} >
 *          <ProseEditor className={styles.page} newView={(newView:EditorView)=>view.current = newView} plugins={appPlugins.current}/>
 *       </Scrollable>
 *    </Card>
 * }
 * ```
 * ### Hook usage: Creating a `ProseEditorMenu`
 * ```
 * function AppMenuBar() {
 *    const {currentView} = useProseEditorContext()
 *    return <ProseEditorMenu view={currentView} className={styles.menu}/>
 * }
 * ```
 * see {@link ProseEditorContext}
 */
export function useProseEditorContext():ProseEditorContext {
   const context = useContext(proseEditorContext)
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
