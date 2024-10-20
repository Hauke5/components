import { Node, NodeType }           from 'prosemirror-model'
import { MarkdownSerializerState }  from 'prosemirror-markdown'
import { Token }                    from 'markdown-it';
import { NodeDef }                  from "../schema"
import { listItem }                 from './listItem';
import { listIsTight }              from './listSupport';
import { InputRule, wrappingInputRule } 
                                    from 'prosemirror-inputrules';
import { isNodeTodo }               from './listSupport/listCommands';
import { nodeIsActive, nodeToggle, nodeWrapIn } 
                                    from './nodeSupport';


const specName = 'bullet_list'


export const bulletList:NodeDef = {
   specName,
   schemaSpec: {
      content:    `${listItem.specName}+`,
      group:      'block',
      attrs:      {tight: {default: false}},
      parseDOM: [{
         tag:     'ul', 
         getAttrs: (dom:HTMLElement) => ({tight: dom.hasAttribute('data-tight')})
      }],
      toDOM(node:Node) { 
         return ['ul', {
            'data-tight': node.attrs.tight ? 'true' : null
         }, 0] 
      }
   },
   pasteRules: [],
   inputRules: [bulletListInputRule],
   keys: () => ({ 
      'Shift-Ctrl-8': bulletList.actions.wrapIn!,
   }),
   actions: {
      isActive:   ()=>nodeIsActive(specName),
      toggle:     ()=>nodeToggle(specName),
      wrapIn:     ()=>nodeWrapIn(specName)
   },
   toMarkdown(state: MarkdownSerializerState, node: Node) {
      state.renderList(node, '  ', () => '- ');
   },
   fromMarkdown: {
      [specName]: {
         block: specName,
         getAttrs: (_: any, tokens: Token[], i: number) => ({ 
            tight: listIsTight(tokens, i) 
         }),
      },
   },
}


function bulletListInputRule(type:NodeType):InputRule {
   return wrappingInputRule(/^\s*([-+*])\s$/, type, 
      undefined, 
      (_str, node) => (node.lastChild && isNodeTodo(node.lastChild))? false : true
   )
}
