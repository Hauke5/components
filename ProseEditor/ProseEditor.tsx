'use client'
import { MouseEvent, useEffect, useId, useRef }     
                                    from 'react';
import { DOMParser, Node, Schema }  
                                    from 'prosemirror-model';
import { EditorState, Plugin, Transaction }   
                                    from 'prosemirror-state';
import { EditorView as PmEditorView }  
                                    from 'prosemirror-view';
import { keymap }                   from 'prosemirror-keymap';
import { Log }                      from '@hauke5/lib/utils';
import { useAppDesc }               from '@hauke5/lib/apps';
import { BaseProps }                from '@hauke5/components/BaseProps';
import { useProseEditorContext }    from './hooks/useProseEditorContext'
import { changeContentPlugin, changedSelectionPlugin } 
                                    from './plugins/changedPlugin';
import { schema, schemaPlugins }    from './setup/schema';
import { markdownParser, markdownSerializer } 
                                    from './setup/markdown/markdown';
import styles                       from './styles/proseEditor.module.scss'
import { hideCompletedTodosPlugin } from './plugins/hideCompletedTodosPlugin';
import './styles/gapcursor.css'
                                 
const log = Log(`ProseEditor`)


export function serialize(state:EditorState) {  
   return markdownSerializer.serialize(state.doc)
}

export type EditorView = PmEditorView & {
   __myID:  string
}

export interface ProseEditorProps extends BaseProps{
   panelID?:         string
   newContent?:      string
   plugins?:         (()=>Plugin[]) | Plugin[]
   newView?:         (view:EditorView)=>void
   usePopupMenu?:    boolean
}
/**
 * Provides a Prosemirror Editor.
 * All parameters are optional:
 * - `panelID` sets the id of the `<div>` used by `Prosemirror` to attach the doc nodes. 
 * This will be set using `useId()` if omitted
 * - `newContent`: provides the initial content to be shown in the editor
 * - `plugins`:   allows a set of app-specific plugins to be installed upon creating the editor
 * - `newView`: allows a callback to be informed of the `view` instance for this editor
 * - `usePopupMenu` (default: `true`) will produce a popup menu for formatting options at the cursor location 
 * @param param 
 * @returns 
 */
export function ProseEditor({panelID, newContent='Your Text Here', className, usePopupMenu=true, plugins, newView, title='', ...props}:ProseEditorProps) {
   const {key}                   = useAppDesc()
   const {addView, removeView}   = useProseEditorContext()
   const view                    = useRef<EditorView>()
   const id                      = useId()

   useEffect(()=>{ 
      const allPlugins = setupPlugins(getPluginRef(plugins), key)
      view.current = createView(newContent, allPlugins, panelID ?? id, dispatchTransaction)
      log.info(`useEffect with content '${newContent.length}', created view ${view.current.__myID}`)
      newView?.(view.current)   // inform parent of new view, if defined; allows for custom __myID
      addView(view.current)
      // if (wasUndefined) // run once with empty dispatch, needed to initialize variablePlugin (others???) 
      //    view.current.dispatch(view.current.state.tr)

      return () => {
         if (view.current) {
            removeView(view.current)
            view.current.destroy() 
            view.current = undefined
         }
      }
      function dispatchTransaction(transaction:Transaction) {
         if (view.current) try { 
            view.current.updateState(view.current.state.apply(transaction)) 
         } catch(e) {
            log.warn(`error applying transaction: ${e}`)
            console.trace()
         }
      }   
   },[addView, removeView, id, newContent, newView, panelID, plugins, key])

   return <>
      <div id={panelID ?? id} onClick={onClick} className={`${styles.editor} ${className}`} {...props} title={`id=${title}${view.current?.__myID}`}/>   
   </>

   function onClick(e:MouseEvent<HTMLDivElement>) {
      // for some reason, checking todo list items doesn't work without this event
      e.preventDefault()
   }
   function defaultKeyBindings() {
      return keymap({})
   }
}

function createView(content:string, plugins:Plugin<any>[], id:string, dispatchTransaction:(transaction: Transaction)=> void):EditorView {
   const state = newEditorState(content ?? '', plugins)
   const view = new PmEditorView(mount, { state, attributes:{}, dispatchTransaction}) as EditorView
   view.__myID ??= `>${Math.floor(100000*Math.random())}`
   log.debug(`created view ${view.__myID}`)
   if (!view.hasFocus()) view.focus();
   return view

   function mount(prosemirrorNode: HTMLElement) {
      const parent = document.getElementById(id)
      parent?.replaceChildren(prosemirrorNode)
   }
}
function newEditorState(content="# New Page", plugins?: Plugin<any>[]) {
   const doc = createDocument(schema, content)
   return EditorState.create({doc, plugins});
}      


function getPluginRef(plugins?:(()=>Plugin[]) | Plugin[]) {
   switch(typeof plugins) {
      case 'undefined': return []
      case 'function':  return plugins()
      default:          return plugins
   }
}

function createDocument(schema:Schema, content:string): Node {
   let node = markdownParser.parse(content)
   if (!node) {
      const element = document.createElement('div');
      element.innerHTML = 'no content found';
      node = DOMParser.fromSchema(schema).parse(element);
   }
   return node
};

function setupPlugins(appPlugins:Plugin[]=[], appKey:string):Plugin[] {
   return  [
      ...schemaPlugins(schema),
      ...appPlugins,
      changeContentPlugin(),
      changedSelectionPlugin(),
      hideCompletedTodosPlugin({appKey}),
   ]
}

