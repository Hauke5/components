import { Token }                    from 'markdown-it';
import { DOMOutputSpec, Node }      from 'prosemirror-model'
import { liftListItem, sinkListItem, splitListItem } 
                                    from 'prosemirror-schema-list'
import { MarkdownSerializerState }  from 'prosemirror-markdown'
import { splitBlock }               from 'prosemirror-commands';
import { Command }                  from 'prosemirror-state';
import { Action, GenericActions, NodeDef }                  
                                    from "../schema"
import { TodoAttrs }                from './todoList';
import { hasParentNodeOfType, hasVisibleContent, isNodeEmpty } 
                                    from './nodeSupport';
import { isNodeTodo, outdentList }  from './listSupport';


export const specName = 'list_item'
const tag      = 'li'
const DATES_REGEXP = /^(?:\{(\d\d\/\d\d\/\d\d)?(?:-(\d\d\/\d\d\/\d\d)?)?\} )?/

type ListItemActions = GenericActions & {
   splitItem:  Action
   liftItem:   Action
   sinkItem:   Action
}

export const listItem:NodeDef<ListItemActions> = {
   specName,
   schemaSpec: {
      content:    'block+',
      defining:   true,
      parseDOM:   [{tag}],
      toDOM: (): DOMOutputSpec => [tag, {}, 0],
      attrs: {
         todoChecked: { default: null},
         todoCreated: { default: null},
         todoClosed:  { default: null},
      },
   },
   keys: () => ({ 
      'Enter`':      listItem.actions.splitItem,
      'Mod-[':       listItem.actions.liftItem,
      'Mod-]':       listItem.actions.sinkItem,
      'Shift-Tab':   listItem.actions.liftItem,
      'Tab':         listItem.actions.sinkItem,
   }),
   actions: {
      splitItem:    ()=>listItemEnterCommand(specName),
      liftItem:     ()=>liftItem(specName),
      sinkItem:     ()=>sinkItem(specName),
   },
   toMarkdown(state:MarkdownSerializerState, node:Node) {
      state.renderContent(node);
   },
   fromMarkdown: {
      [specName]: {
         block: specName,
         getAttrs: (tok:Token, tokens: Token[], i: number):TodoAttrs|{} => {
            const textLine = tokens[i+2].content
            let todoDone = tok.attrGet('todoChecked') ?? null
            if (todoDone===null) return {}

            // extract Node TodoAttrs from Token text
            const todoChecked = todoDone==='true'? true : todoDone==='false'? false : null
            const match = DATES_REGEXP.exec(textLine)
            let todoCreated:string|null = null
            let todoClosed:string|null = null
            if (match) {
               todoCreated = match[1]? `${match[1]}` : null
               todoClosed  = match[2]? `${match[2]}` : null
               // remove the meta text from the child node
               if (tokens[i+2].children) {
                  tokens[i+2].children![0].content = tokens[i+2].children![0].content.slice(match[0].length)
                  tokens[i+2].content = tokens[i+2].content.slice(match[0].length)
               }
            }
            return {todoChecked, todoCreated, todoClosed}
         },
      },
   },
}

function liftItem(specName:string):Command {
   return (state, dispatch, view) => {
      const type = state.schema.nodes[specName]
      return liftListItem(type)(state, dispatch, view)
   }
}

function sinkItem(specName:string):Command {
   return (state, dispatch, view) => {
      const type = state.schema.nodes[specName]
      return sinkListItem(type)(state, dispatch, view)
   }
}

export function listItemEnterCommand(specName:string): Command {
   return (state, dispatch, view) => {
      const type = state.schema.nodes[specName]
      const {listNode, codeBlock} = state.schema.nodes
      const { selection } = state;
      if (selection.empty) {
         const { $from } = selection;
         let listItem = type ?? listNode

         const node = $from.node($from.depth);
         const wrapper = $from.node($from.depth - 1);
         if (wrapper && wrapper.type === listItem) {
            /** Check if the wrapper has any visible content */
            if (isNodeEmpty(node) && !hasVisibleContent(wrapper)) {
               const grandParent = $from.node($from.depth - 3)
               // To allow for cases where a non-todo item is nested inside a todo item
               // pressing enter should convert that type into a todo listItem and outdent.
               if (isNodeTodo(grandParent) && !isNodeTodo(wrapper)) {
                  return outdentList(listNode)(state,dispatch,view)
               }
               return outdentList(listItem)(state, dispatch, view)
            } 
            if (!codeBlock || !hasParentNodeOfType(codeBlock)(selection)) {
               return splitListItem(listItem, (node:Node) => {
                  if (!isNodeTodo(node)) return node.attrs
                  return {...node.attrs, todoChecked:false, todoCreated:null, todoClosed:null};   // HS: added todoCreated:null
               })(state, dispatch);
            }
         }
      }
      return splitBlock(state, dispatch, view)
   }
}

