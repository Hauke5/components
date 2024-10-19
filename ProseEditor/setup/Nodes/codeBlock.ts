import { Node, NodeType }           from 'prosemirror-model'
import { MarkdownSerializerState }  from 'prosemirror-markdown'
import { textblockTypeInputRule }   from 'prosemirror-inputrules'
import { Token }                    from 'markdown-it'
import { NodeDef }                  from "../schema"
import { nodeIsActive, nodeToggle } from './nodeSupport'

const specName = 'code_block'   // term used in `from_markdown.noCloseToken`

export const code_block:NodeDef = {
   specName,
   schemaSpec: {
      content:    'text*',
      group:      'block',
      code:       true,
      defining:   true,
      marks:      '',
      attrs:      {params: {default: ''}},
      parseDOM:   [{
         tag:     'pre', 
         preserveWhitespace: 'full', 
         getAttrs: (node:HTMLElement) => (
            {params: node.getAttribute('data-params') || ''}
         )
      }],
      toDOM(node:Node) { 
         return ['pre', node.attrs.params ? {'data-params': node.attrs.params} : {}, ['code', 0]] 
      }
   },
   inputRules: [(type:NodeType)=>textblockTypeInputRule(/^```$/, type)],
   pasteRules:       [/^```/],
   keys: () => ({ 
      'Shift-Ctrl-\\':         code_block.actions.toggle!,
   }),
   actions: {
      isActive:   ()=>nodeIsActive(specName),
      toggle:     ()=>nodeToggle(specName),
   },
   toMarkdown(state:MarkdownSerializerState, node:Node) {
      state.write('```' + (node.attrs['language'] || '') + '\n');
      state.text(node.textContent, false);
      state.ensureNewLine();
      state.write('```');
      state.closeBlock(node);
   },
   fromMarkdown: {
      [specName]: { 
         block: specName, 
         noCloseToken: true 
      },
      fence: {
         block: specName,
         getAttrs: (tok: Token) => ({ language: tok.info || '' }),
         noCloseToken: true,
      },
   },
}
