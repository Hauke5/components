'use client'
import { createContext, useRef, useState }         
                                 from "react";
import { BaseProps }             from "@hauke5/components/BaseProps";
import { ErrorBoundarySuspense } from "@hauke5/lib/errors/ErrorBoundary";
import { Log }                   from "@hauke5/lib/utils";
import { EditorView }            from "./Editor";

const log = Log(`EditorContext`)


export type EditorContext =  {
   currentView:   EditorView|null
   views:         EditorView[]
   addView:       (view:EditorView) => void
   removeView:    (view:EditorView) => void
   // setContent:    (content:string) => void
}

export const editorContext = createContext<EditorContext|null>(null)


type EditorContextProps = BaseProps & {
}
/**
 * ## EditorContext
 * provides a context convenience implementation. This context is not used by default within the `Narrative`
 * package. Rather, it is intended to be used on the app level. An example use might look like this:
 * ### Context Definition, e.g. in `layout.tsx`:
 * ```
 * export default function NarrativeLayout({children}:LayoutProps) {
 *   return <ProsemirrorContext>
 *      <NarrativeTitleBar />
 *      {children}
 *   </ProsemirrorContext>
 * }
 * ```
 * ### Context usage: Create a `NarrativeEditor`
 * ```
 * function Component() {
 *    const {currentView, addView} = useProsemirrorContext()
 *    return <Card>
 *       <Scrollable className={`${styles.narrative}`} hasHeader={showMenu}>
 *          {currentView && <NarrativeMenu view={currentView} className={styles.menu}/>}
 *          <NarrativeEditor className={styles.page} getView={setView} plugins={appPlugins()}/>
 *       </Scrollable>
 *    </Card>
 *
 *    function setView(view: EditorView) {
 *       log.info(`setView`)
 *       addView(view)
 *    }
 * }
 * ```
 * ### Context usage: Creating a `NarrativeMenu`
 * ```
 * function AppMenuBar() {
 *    const {currentView} = useProsemirrorContext()
 *    return <NarrativeMenu view={currentView} className={styles.menu}/>
 * }
 * ```
 */
export function EditorContext({children}:EditorContextProps) {
   const [currentView, setActiveView]  = useState<EditorView|null>(null)
   const views                         = useRef<EditorView[]>([])
   const modifyViews                   = useRef({add:addView, remove:removeView})
      
   log.debug(`render ${views.current.length} views: ${currentView?.__myID}`)
   return <ErrorBoundarySuspense what={`ProsemirrorContext`}>
      <editorContext.Provider value={{currentView, views:views.current, addView:modifyViews.current.add, removeView:modifyViews.current.remove}}>
         {children}
      </editorContext.Provider>
   </ErrorBoundarySuspense>

   function addView(newView:EditorView) {
      const i = views.current.findIndex(v => v===newView)
      const newViews = [...views.current, newView]
      views.current = newViews
      log.debug(()=>`addView ${i<0?'new':'existing'} id: ${(newView as any).__myID} of ${newViews.length} views: [${viewsList(newViews)}]`)
      setActiveView(newView)
   }
   function removeView(oldView:EditorView) {
      const i = views.current.findIndex(v => v===oldView)
      if (i<0) {
         log.warn(`removeView: did not find view ${(oldView as any).__myID} in [${viewsList(views.current)}]`)
         return
      }
      views.current = views.current.filter(v=>v!==oldView)
      // setViews(views.current.filter(v=>v.__myID!==oldView.__myID))
      setActiveView(views.current.find(v=>v.hasFocus()) ?? null)
      const inew = views.current.findIndex(v => v===currentView)
      log.debug(()=>`removeView ${i}, id=${(oldView as any).__myID}, new current is ${inew} of ${views.current.length}: [${viewsList(views.current)}]`)
   }
}


function viewsList(views:EditorView[]) {
   return views.map((v:any)=> v.__myID).join(', ')
}
