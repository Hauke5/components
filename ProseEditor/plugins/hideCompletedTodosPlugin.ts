import { Node }            from "prosemirror-model";
import { Decoration, DecorationSet }   
                           from "prosemirror-view";
import { Plugin, PluginKey, EditorState } 
                           from "prosemirror-state"
import { getLocalStorage } from "@hauke5/lib/hooks";
import { pluginTiming }    from "../hooks/useTimings";


const pluginName  = "hideCompletedTodosPlugin"
const {tmInit, tmApply, tmDecos} = pluginTiming(pluginName)

export const hideCompletedTodosPluginKey = new PluginKey<HideCompletedTodosState>(pluginName)

type HideCompletedTodosState = {
   showToDos:  boolean
   decoSet:    DecorationSet
}

type HideCompletedTodosProps = {
   show?:      boolean
   appKey:     string
}

/**
 * adds `Decorations` to hide or show completed todo-list items.
 * - The `Decorations` are created only once at initialization. That means that closing an open todo lets it remain visible until reloading the page.
 * - The `Decorations` are applied dynamically depending on the plugin state value `showToDos`
 * - the plugin state value `showToDos` can be dynamically toggled by passing `true` as a meta information to the plugin
 */
export const hideCompletedTodosPlugin = ({show, appKey}:HideCompletedTodosProps) => {
   const store = getLocalStorage(appKey)
   const hidePrefsKey = 'hideCompletedTodos'
   const hideDefault = store.getItem<boolean>(hidePrefsKey)
   show = show ?? !hideDefault
   return new Plugin<HideCompletedTodosState>({
      state: {
         init(_, state) { 
            return tmInit(()=> {
               const decos = todoDecos(state.doc)
               const decoSet = DecorationSet.create(state.doc, decos)
               return {showToDos:show, decoSet}
            })
         },
         apply(tr, old, oldState, newState:EditorState) { 
            return tmApply(() => {
               // toggle `showToDos` if meta===`true` and correctly map existing decos
               let showToDos = old.showToDos
               if (tr.getMeta(hideCompletedTodosPluginKey)===true) {
                  showToDos = !showToDos
                  store.setItem(hidePrefsKey, !showToDos) // mark new show status as default in localStorage
               }
               return {
                  showToDos, 
                  decoSet:    old.decoSet.map(tr.mapping, newState.doc)
               }
            })
         }
      },
      props: {
         decorations(state) {
            return tmDecos(()=> {
               const s = this.getState(state)
               return s?.showToDos? DecorationSet.empty : s?.decoSet
            })
         }
      },
      key: hideCompletedTodosPluginKey,
   })

}


function todoDecos(doc:Node) {
   const decos = todoDecoSpecs(doc).map(spec => Decoration.node(spec.from, spec.to, {hideCompletedTodos:''}))
   return decos
}

function todoDecoSpecs(node:Node) {
   const decoSpecs:{from:number, to:number}[] = []
   // For each top-level node in the document
   node.descendants(function addTodoSpec(node: Node, pos: number){
      decoSpecs.push({from:pos, to:pos+node.nodeSize})
      return true   // true=don't descend
   })

   return decoSpecs
}