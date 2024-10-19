import { Node }                     from 'prosemirror-model'
import { MarkdownSerializerState }  from 'prosemirror-markdown'
import { NodeDef }                  from '../../schema'

export const doc:NodeDef = {
   specName:      'doc',
   schemaSpec: {
      content:    'block+'
   },
   toMarkdown:    ()=>null,
   fromMarkdown:  {},
   inputRules:    [],
   pasteRules:    [],
   actions:       {}
}


export const text:NodeDef = {
   specName:      'text',
   schemaSpec: {
      group:      'inline'
   },
   toMarkdown(state:MarkdownSerializerState, node: Node) {
      state.text(node.text ?? '');
   },
   fromMarkdown:  {},
   inputRules:    [],
   pasteRules:    [],
   actions:       {}
}
