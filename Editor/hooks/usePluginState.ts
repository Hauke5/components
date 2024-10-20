import { Log }          from '@hauke5/lib/utils';
import { EditorState, Plugin, PluginKey }    
                        from 'prosemirror-state';
import { Dispatch, useEffect, useId, useState } 
                        from 'react';
import { EditorView }   from '../Editor';

const log = Log(`usePluginState`).debug

/** keeps the state of a plugin and triggers a redraw when it changes */
export function usePluginState<PLUGIN_STATE>(pluginKey: PluginKey<PLUGIN_STATE>, view?:EditorView|null):string {
   const id                = useId()
   const [state, setState] = useState<string>('');

   useEffect(() => {
      if (view?.state) {
         const watcherKey:string = `${getWatcherKey(pluginKey, id)}_${view?.__myID}`
         // set initial state for new id or view
         const watchedState = pluginKey.getState(view.state)
         log(`useEffect ${watcherKey}: ${watchedState}`)

         if (watchedState) setState(getWatcherStateValue(watcherKey, watchedState))
         // @ts-ignore EditorView.docView is missing in @types/prosemirror-view
         if (view.docView && !hasWatcher(view.state, watcherKey)) {
            log(`adding plugin watcher with key '${watcherKey}'`)
            view.updateState(addPluginWatcher(view.state, watcherPlugin(pluginKey, watcherKey, setState)))
            return () => {
               log(`removing plugin watcher with key '${watcherKey}'`)
               removePluginWatcher(view.state, watcherKey)
               setState('')
            }
         }
      }
   }, [view, id, pluginKey]);
// log(`render ${state}`)
   return state ?? null;
}


function watcherPlugin<PLUGIN_STATE>(pluginKey: PluginKey<PLUGIN_STATE>, watcherKey:string, setState: Dispatch<string>) {
   return new Plugin<string>({
      key: new PluginKey(watcherKey),
      view: () => ({ 
         update: (view, prevState) => {
            const oldWatchedState = pluginKey.getState(prevState)
            const newWatchedState = pluginKey.getState(view.state)
            log(`watcher ${watcherKey} state updated from ${oldWatchedState} to ${newWatchedState}`)
            if (oldWatchedState === newWatchedState) return;
            // set state to '' if `newWatchedState` is the initial state (i.e., falsy): 
            const watcherState = newWatchedState? getWatcherStateValue(watcherKey, newWatchedState) : ''
            log(`watcherPlugin watched state updated from ${oldWatchedState} to ${newWatchedState}: ${watcherState}`)
            setState(watcherState)
         }
      })
   });
}

/** adds a watcher plugin */
const addPluginWatcher = (state: EditorState, watcher: Plugin) => {
   const plugins = [...state.plugins, watcher]
   log(`addPluginWatcher(${(watcher as any).key}) -> ${plugins.length}, [${/*plugins.map((p:any)=>p.key).join(',')*/''}]`)
   return state.reconfigure({plugins});
};    

/** removes a watcher plugin */
const removePluginWatcher = (state: EditorState, key:string) => {
   const plugins = state.plugins.filter((p:any) => p.key.indexOf(key)<0)
   log(`removePluginWatcher(${key}) ${state.plugins.length} -> ${plugins.length}, [${/*plugins.map((p:any)=>p.key).join(',')*/''}]`)
   return state.reconfigure({plugins})
};    

function hasWatcher(state:EditorState, key:string) {
   return state.plugins.some((p:any) => p.key.indexOf(key)===0)
}

function getWatcherKey(key:PluginKey, id:string) {
   return `watching_${(key as any).key}_${id}`
}

function getWatcherStateValue<PLUGIN_STATE>(watcherKey:string, state:PLUGIN_STATE) {
   return `${watcherKey}_${state}`
}