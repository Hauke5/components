import { MutableRefObject, useEffect, useRef }             
                                 from 'react'
import { getDebouncer, Log }     from '@hauke5/lib/utils'
import { EditorView, serialize }           
                                 from '../Editor'
import { useEditorContext } from './useEditorContext'
import { useContentChange }      from './useChange'

const log = Log(`useAutoAction`)
const debounce = getDebouncer()

const DefDebouncePeriod = 2000

export type AutoPostActionCallback = ((content:string, contentChangeState:string|null)=>Promise<void>) | null
export type AutoPreActionCallback = ()=>Promise<void>

export type AutoAction = {
   /** called with each content change, prior to debouncing */
   preAction?:       AutoPreActionCallback
   /** called after debouncing the content change(s) to perform the auto-action */
   postAction?:      AutoPostActionCallback
   debouncePeriod?:  number
}

/**
 * Checks for **content** changes in the current `EditorView` and debounces them.
 * - a `preAction` is called once the change is detected
 * - a `postAction` is called once the debouncer triggers, 
 * which is roughly `waitPeriod` ms after the last detected change 
 * @returns a `MutableRefObject` that can be set to define the `preAction`, `postAction`, and `debouncePeriod`
 */
export function useAutoAction():MutableRefObject<AutoAction | null> {
   const {currentView}        = useEditorContext()
   const contentChangeState   = useContentChange(currentView)
   const actions              = useRef<AutoAction|null>(null)
   const viewRef              = useRef(currentView)

   useEffect(()=>{
      if (currentView) {
         const label = `autoAction_${viewRef.current?.__myID}`
         debounce.cancel(label, true)
         viewRef.current = currentView
      }
   },[currentView])
   
   useEffect(()=>{
      // called when the content changes
      if (contentChangeState && actions.current?.postAction) {
         log.debug(`useAutoAction useEffect ${contentChangeState} ${viewRef.current?.__myID}`)
         const label = `autoAction_${viewRef.current?.__myID}`
         const view = viewRef.current
         const postAction = actions.current.postAction
         actions.current.preAction?.()
         const period = actions.current.debouncePeriod ?? DefDebouncePeriod
         debounce(label, period, contentAction, view, postAction, contentChangeState)
      }
   },[contentChangeState])
   log.debug(`render ${contentChangeState}`)
   return actions
}

async function contentAction(view:EditorView|null, callBack:AutoPostActionCallback, contentChangeState:string|null) {
   if (!view) {
      log.warn(`useAutoAction: new view defined`)
      return
   }
   const content = serialize(view.state)
   log.debug(()=>`autoAction context ${content.length} chars, ${view.isDestroyed?'not ':''}notifying view ${view.__myID}`)
   await callBack?.(content, contentChangeState)
   if (!view.isDestroyed) view.dispatch(view.state.tr)
}      
