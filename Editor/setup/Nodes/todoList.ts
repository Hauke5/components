import { InputRule, wrappingInputRule }   from 'prosemirror-inputrules';
import { Node, NodeType }                 from 'prosemirror-model'
import { MarkdownSerializerState }        from 'prosemirror-markdown'
import { Token }                          from 'markdown-it';
import { NodeDef }                        from "../schema"
import listToDoMarkdownPlugin             from '../markdown/listToDoMarkdownPlugin';
import { listItem }                       from './listItem';
import { listIsTight, todoPlugin }              
                                          from './listSupport';                  
import { nodeIsActive, nodeToggle, nodeWrapIn } 
                                          from './nodeSupport';

const TODO_REGEXP    = /^\[([ xX])?\]\s$/

const specName = 'todo_list'
export type TodoAttrs = {
   todoChecked:   boolean|null
   todoCreated:   string|null
   todoClosed:    string|null
}

export const todoList:NodeDef = {
   specName,
   schemaSpec: {
      content:    `${listItem.specName}+`,
      group:      'block',
      attrs:      {
         tight:         {default: false},
      },
      parseDOM: [{
         tag:     'ul', 
         getAttrs: (dom:HTMLElement) => ({
            tight:      dom.hasAttribute('data-tight'),
         })
      }],
      toDOM(node:Node) { 
         return ['ul', {
            'data-tight':  node.attrs.tight ? 'true' : null,
            'todo-list':   node.attrs.todoList ?? true
         }, 0] 
      }
   },
   nodeViewPlugins: [todoPlugin],
   inputRules: [todoListInputRule],
   keys: () => ({ 
      'Shift-Ctrl-[': todoList.actions.wrapIn!,
   }),
   actions: {
      isActive:   ()=>nodeIsActive(specName),
      toggle:     ()=>nodeToggle(specName),
      wrapIn:     ()=>nodeWrapIn(specName)
   },
   toMarkdown(state:MarkdownSerializerState, node:Node, parent: Node, index: number) {
      state.renderList(node, "    ", (i:number) => {
         const child = node.child(i)
         const {todoCreated, todoClosed, todoChecked} = child.attrs
         if (todoChecked != null) {
            const marker = todoChecked ? '[x]' : '[ ]'
            const createdMarker = todoCreated ?? ''
            const closedMarker = todoClosed? `-${todoClosed}` : ''
            if (todoCreated||todoClosed) return(`${marker} {${createdMarker}${closedMarker}} `)
               else return(`${marker} `)
         }
         console.warn(`todoList:toMarkdown has undefined todoChecked`)
         return ''
      })
   },
   fromMarkdown: {
      [specName]: {
         block: specName,
         getAttrs: (tok: any, tokens: Token[], i: number) => {
            return { 
               tight: listIsTight(tokens, i),
            }
         },
      },
   },
   markdownItPlugin: {
      ruleName:   'todoList',
      alt:        ['paragraph'],
      where:      {before:'list'},
      ruleBlock:  listToDoMarkdownPlugin
   },
}


function todoListInputRule(type:NodeType):InputRule {
   return wrappingInputRule(TODO_REGEXP, type)
}
