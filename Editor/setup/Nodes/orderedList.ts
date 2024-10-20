import { Node, NodeType }           from 'prosemirror-model'
import { MarkdownSerializerState }  from 'prosemirror-markdown'
import { InputRule, wrappingInputRule } 
                                    from 'prosemirror-inputrules';
import { Token }                    from 'markdown-it';
import { NodeDef }                  from "../schema"
import { listIsTight }              from './listSupport';
import { listItem }                 from './listItem';
import { nodeIsActive, nodeToggle, nodeWrapIn } 
                                    from './nodeSupport';

const specName = 'ordered_list'

export const orderedList:NodeDef = {
   specName,
   schemaSpec: {
      content:    `${listItem.specName}+`,
      group:      'block',
      attrs: {
         order:   {default: 1, validate: "number"}, 
         tight:   {default: false}
      },
      parseDOM: [{
         tag:     'ol', 
         getAttrs(dom:HTMLElement) {
            return {
               order: dom.hasAttribute('start') ? +(dom as HTMLElement).getAttribute('start')! : 1,
               tight: dom.hasAttribute('data-tight')
            }
         }
      }],
      toDOM(node) {
         return ['ol', {
            start: node.attrs.order,   // == 1 ? null : node.attrs.order,
            'data-tight': node.attrs.tight ? 'true' : null
         }, 0]
      }
   },
   pasteRules: [],
   inputRules: [orderedListInputRule],
   keys: () => ({ 
      'Shift-Ctrl-9': orderedList.actions.wrapIn!,
   }),
   actions: {
      isActive:   ()=>nodeIsActive(specName),
      toggle:     ()=>nodeToggle(specName),
      wrapIn:     ()=>nodeWrapIn(specName)
   },
   toMarkdown(state:MarkdownSerializerState, node:Node) {
      let start = node.attrs['order'] || 1;
      let maxW = String(start + node.childCount - 1).length;
      let space = state.repeat(' ', maxW + 2);
      state.renderList(node, space, (i) => {
         let nStr = String(start + i);
         return state.repeat(' ', maxW - nStr.length) + nStr + '. ';
      });
   },
   fromMarkdown: {
      [specName]: {
         block: specName,
         getAttrs: (tok: Token, tokens: Token[], i: number) => {
            return {
               tight: listIsTight(tokens, i),
               order: +(tok.attrGet('start') ?? 1),
            };
         },
      },
   },
}


function orderedListInputRule(type:NodeType):InputRule {
   return wrappingInputRule(/^((?:\d)+)[.)]\s$/, type,
      (match) => ({ order: +match[1]! }),
      (match, node) => node.childCount + node.attrs['order'] === +match[1]!
   )
}
