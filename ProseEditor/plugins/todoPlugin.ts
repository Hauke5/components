import { DOMOutputSpec, DOMSerializer, Node }                     
                        from 'prosemirror-model'
import { EditorState, Plugin, PluginKey, Transaction }        
                        from 'prosemirror-state'
import { Decoration, EditorView, NodeView } 
                        from 'prosemirror-view'
import { formatDate, Log } 
                        from '@hauke5/lib/utils'
import { TodoAttrs }    from '../setup/Nodes/todoList'
import { listItem }     from '../setup/Nodes/listItem'


const log = Log(`todoListItemViewPlugin`)
const HAS_TODO_ATTR = 'hasTodo'   // applies to <li>: marker for if the li has a checkbox or not

type GetPosFunction = () => number
type UpdateAttrsFunction = (attrs:TodoAttrs) => void
type BaseNodeView = NodeView & {
   node: Node
   containerDOM:  HTMLElement|undefined
   decorations:readonly Decoration[]
}
type NodeViewProps = {
   node: Node
   view: EditorView
   getPos: GetPosFunction
   decorations: readonly Decoration[]
   selected: boolean
   attrs:TodoAttrs
   updateAttrs: UpdateAttrsFunction
}

/** a `prosemirror` plugin to define todo list behavior */
export const todoPlugin = () => new Plugin({
   key: new PluginKey(`${listItem.specName}_Input_click`),
   props: {
      nodeViews: {
         [listItem.specName]: viewConstructor
      },
   },
})

function viewConstructor(node:Node, view:EditorView, getPos:()=>number, decorations:Decoration[]):NodeView {
   const containerDOMSpec:DOMOutputSpec = ['li', {}, ['span', {content:''}]]
   const contentDOMSpec:DOMOutputSpec   = ['span', {}]
   const _dom = createElement(containerDOMSpec)
   const nodeState:BaseNodeView = {
      node,
      dom:           _dom, 
      containerDOM:  _dom,
      contentDOM:    createElement(contentDOMSpec),
      decorations
   }
   let selected   = false

   renderCreate(nodeState, getNodeViewProps())

   return  {
      dom:        nodeState.containerDOM!,
      contentDOM: nodeState.contentDOM,
   
      destroy() {
         renderDestroy(nodeState, getNodeViewProps())
         nodeState.containerDOM = undefined
         nodeState.contentDOM = undefined
      },
   
      // PM essentially works by watching mutation and then syncing the two states: its own and the DOM.
      ignoreMutation(mutation: MutationRecord | {type: 'selection', target: Element}) {
         // For PM an atom node is a black box, what happens inside it are of no concern to PM
         // and should be ignored.
         if (nodeState.node.type.isAtom) return true
   
         // donot ignore a selection type mutation
         if (mutation.type === 'selection') return false
   
         // if a child of containerDOM (the one handled by PM)
         // has any mutation, do not ignore it
         if (nodeState.containerDOM!.contains(mutation.target)) return false
   
         // if the contentDOM itself was the target
         // do not ignore it. This is important for schema where
         // content: 'inline*' and you end up delete all the content with backspace
         // PM needs to step in and create an empty node.
         if (mutation.target === nodeState.contentDOM) return false
         return true
      },
   
      update(node: Node, decorations: readonly Decoration[]) {
         // https://github.com/ProseMirror/prosemirror/issues/648
         if (nodeState.node.type !== node.type) return false
   
         if (nodeState.node === node && (nodeState.decorations===decorations || decorations.length===0))
            return true
   
         nodeState.node = node
         nodeState.decorations = decorations
         renderUpdate(nodeState, getNodeViewProps())
   
         return true
      },              
   }

   function getNodeViewProps(): NodeViewProps {
      const attrs = nodeState.node.attrs as TodoAttrs
      return {
         node: nodeState.node,
         view,
         getPos,
         decorations,
         selected,
         attrs,
         updateAttrs: (newAttrs:TodoAttrs) => {
            view.dispatch(updateAttrs(getPos(), nodeState.node, newAttrs, view.state.tr))
         }
      }
   }
}

function renderCreate(instance:BaseNodeView, { attrs, updateAttrs, getPos, view}:NodeViewProps) {
   let { todoChecked, todoClosed, todoCreated } = attrs
   todoChecked ??= false
   todoCreated ??= todoTimeFormat(new Date())
   if (isParentTodoList(view.state, getPos())) {
      const newAttrs = { todoChecked, todoClosed, todoCreated }
      setupCheckbox(newAttrs, updateAttrs, instance)
   }

   // Connect the two contentDOM and containerDOM for pm to write to
   instance.containerDOM!.lastChild!.appendChild(instance.contentDOM!)
}

/**
 * Establishes program-drive binding to checkbox; the user/event-based binding is done by  inputElement's `input` event listener
 */
function renderUpdate(instance:BaseNodeView, { attrs, view, getPos, updateAttrs }:NodeViewProps) {
   let { todoChecked, todoClosed, todoCreated } = attrs
   if (todoChecked == null) {
      removeCheckbox(instance)
      return
   }

   if (!isParentTodoList(view.state, getPos())) return

   setupCheckbox(attrs, updateAttrs, instance)
   const checkbox = instance!.containerDOM!.firstChild!.firstChild! as HTMLInputElement
   checkbox.checked = todoChecked

   const newTodoClosed = todoChecked? todoClosed ?? todoTimeFormat(new Date()) : null

   const metadataSpan = instance.containerDOM?.lastChild?.firstChild as HTMLSpanElement
   const closedSpan = metadataSpan?.lastChild as HTMLSpanElement
   if (closedSpan) {
      closedSpan.textContent = todoClosed? `-${todoClosed}` : ''
      metadataSpan.setAttribute('todoMeta', `${!!todoCreated||!!todoClosed}`)
   }
   if (newTodoClosed !== todoClosed)   // avoid recursive update loop if nothing changed
      updateAttrs({todoChecked, todoCreated, todoClosed:newTodoClosed})
}

function renderDestroy(instance:BaseNodeView, { attrs, view, getPos, updateAttrs }:NodeViewProps) {
}


function createElement(spec: DOMOutputSpec): HTMLElement {
   const { dom, contentDOM } = DOMSerializer.renderSpec(window.document, spec)
   if (contentDOM) {
      throw new Error('createElement does not support creating contentDOM')
   }
   return dom as HTMLElement
}

function todoTimeFormat(date:Date) {
   return formatDate('%MM/%DD/%YY', date)
}

const isParentTodoList = (state:EditorState, pos:number) => 
   state.doc.resolve(pos).parent.type.name === 'todo_list'     // can't use todoList.specName because of import conflict

const removeCheckbox = (instance: BaseNodeView) => {
   // log(`removeCheckbox ${hasCheckbox(instance)?true:false}`)
   if (!instance.containerDOM!.hasAttribute(HAS_TODO_ATTR)) return // already removed
   instance.containerDOM!.removeAttribute(HAS_TODO_ATTR)
   instance.containerDOM!.removeChild(instance.containerDOM!.firstChild!)
}

const setupCheckbox = (attrs:TodoAttrs, updateAttrs: UpdateAttrsFunction, instance: BaseNodeView) => {
   if (instance.containerDOM!.hasAttribute(HAS_TODO_ATTR)) return  // already created
   const {checkbox, dateFields, newAttrs: meta} = createCheckbox(attrs, (update:CheckboxUpdate) => updateAttrs(update))

   instance.containerDOM!.setAttribute(HAS_TODO_ATTR, attrs.todoClosed?'closed':'open')
   instance.containerDOM!.prepend(checkbox)
   instance.containerDOM!.lastChild!.appendChild(dateFields)
   updateAttrs(meta)
}

type CheckboxUpdate = {todoChecked:boolean|null, todoCreated:string|null, todoClosed:string|null}

const createCheckbox = (attrs:TodoAttrs, onUpdate: (update:CheckboxUpdate)=>void) => {
   let { todoChecked, todoCreated, todoClosed } = attrs
   todoClosed = todoChecked? todoClosed ?? null : null

   const title = `created: ${todoCreated ?? '??'}${todoClosed?`\nclosed: ${todoClosed}`:''}`
   const checkbox = createElement(['span', {contentEditable:false}, 
      ['input', {type:'checkbox', title}], 
   ])
   const inputElement = checkbox.querySelector('input')!
   if (todoChecked) inputElement.setAttribute('checked', '')
   // inputElement.addEventListener('input', (_event) => inputUpdate(inputElement.checked, 'input'));
   // HS: added `mousedown` since `input` does not react; and added `!` since this is supposed to be the new value
   inputElement.addEventListener('mousedown', (_event) => inputUpdate(!inputElement.checked, 'mousedown'))

   const todoMetaSpanContent:DOMOutputSpec[] = []
   todoMetaSpanContent.push(['span', {todoCreated:''}, todoCreated??''])
   todoMetaSpanContent.push(['span', {todoClosed:''}, todoClosed?`-${todoClosed}`:''])
      const dateFields = createElement(['span', {todoMeta:!!todoCreated||!!todoClosed}, 
      ...todoMetaSpanContent
   ])
   return {checkbox, dateFields, newAttrs:{todoChecked, todoCreated, todoClosed}}

   function inputUpdate(todoChecked:boolean, eventName:string) {
      const todoClosed = todoChecked?todoTimeFormat(new Date()):''
      log(`inputUpdate ${eventName}: ${todoChecked}, created ${todoCreated}, closed ${todoClosed}`)
      onUpdate({todoChecked, todoCreated, todoClosed})
   }
}

function updateAttrs(pos: number, node: Node, newAttrs: Node['attrs'], tr: Transaction) {
   return tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      ...newAttrs,
   })
}
