import { setBlockType }    from 'prosemirror-commands'
import { Command, EditorState, Transaction } 
                           from 'prosemirror-state'
import { EditorView }      from 'prosemirror-view'
import { Action, NodeActions, NodeDef }        
                           from '../schema'
import { nodeCopy, nodeCut, nodeInsert, nodeIsActive, nodeJumpToBorder, nodeMove } 
                           from './nodeSupport'

const specName = 'paragraph'

export const paragraph:NodeDef<ParagraphActions> = {
   specName,
   schemaSpec: {
      content:       'inline*',
      group:         'block',
      parseDOM:      [{tag: 'p'}],
      toDOM() { return ['p', 0] }
   },
   inputRules:       [],
   pasteRules:       [],
   keys: () => ({ 
      'Shift-Ctrl-0':   paragraph.actions.convertToParagraph,
      'Alt-ArrowUp':    paragraph.actions.moveUp,
      'Alt-ArrowDown':  paragraph.actions.moveDown,
      'Ctrl-a':         paragraph.actions.jumpToStartOfParagraph,
      'Ctrl-e':         paragraph.actions.jumpToEndOfParagraph,
      'Mod-c':          paragraph.actions.copy,
      'Mod-x':          paragraph.actions.cut,
      'Mod-Shift-Enter':paragraph.actions.insertEmptyParaAbove,
      'Mod-Enter':      paragraph.actions.insertEmptyParaBelow,
   }),
   actions: {
      isActive:               ()=>nodeIsActive(specName),
      toggle:                 convertToParagraph,
      convertToParagraph:     ()=>convertToParagraph(),
      moveUp:                 ()=>nodeMove(false),
      moveDown:               ()=>nodeMove(true),
      jumpToStartOfParagraph: ()=>nodeJumpToBorder(true),
      jumpToEndOfParagraph:   ()=>nodeJumpToBorder(false),
      copy:                   ()=>nodeCopy(),
      cut:                    ()=>nodeCut(),
      insertEmptyParaAbove:   ()=>nodeInsert(true),
      insertEmptyParaBelow:   ()=>nodeInsert(true),
   },
   toMarkdown(state, node) {
      state.renderInline(node);
      state.closeBlock(node);
   },
   fromMarkdown: {
      paragraph: {
         block: 'paragraph'
      }
   },
}


function convertToParagraph():Command {
   return (state:EditorState, dispatch?: (tr:Transaction)=>void, view?:EditorView) => {
      const paragraphType = state.schema.nodes[specName]
      return setBlockType(paragraphType)(state, dispatch, view)
   }
}

type ParagraphActions = NodeActions & {
   convertToParagraph:     Action
   moveUp:                 Action
   moveDown:               Action
   jumpToStartOfParagraph: Action
   jumpToEndOfParagraph:   Action
   copy:                   Action
   cut:                    Action
   insertEmptyParaAbove:   Action
   insertEmptyParaBelow:   Action
}