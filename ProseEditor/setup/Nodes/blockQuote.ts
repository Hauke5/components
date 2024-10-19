import { Node }                     from 'prosemirror-model'
import { MarkdownSerializerState }  from 'prosemirror-markdown'
import { NodeDef }                  from "../schema"
import { nodeIsActive, nodeToggle, nodeWrapIn }             
                                    from './nodeSupport'


const specName = 'blockquote'    // name determined internally by `markdown-it.parserBlock

export const blockQuote:NodeDef = {
   specName,
   schemaSpec: {
      content:    'block+',
      group:      'block',
      parseDOM:   [{tag: 'blockquote'}],
      toDOM() { return ['blockquote', 0] }
   },
   inputRules:    [],
   pasteRules:    [],
   keys: () => ({ 
      'Ctrl->`':         blockQuote.actions.toggle!,
      'Shift-Ctrl-ArrowRight': blockQuote.actions.wrapIn!,
   }),
   actions: {
      isActive:   ()=>nodeIsActive(specName),
      toggle:     ()=>nodeToggle(specName),
      wrapIn:     ()=>nodeWrapIn(specName),
   },
   toMarkdown: (state: MarkdownSerializerState, node: Node) =>
      state.wrapBlock('> ', null, node, () => state.renderContent(node)),
   fromMarkdown: {
      [specName]: {block: specName },
   },
}
