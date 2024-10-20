import { Command, EditorState, Transaction } 
                        from "prosemirror-state";
import { NodeType }     from "prosemirror-model";
import { InputRule }    from "prosemirror-inputrules";
import { Action, GenericActions, NodeDef }   
                        from "../schema"
import { safeInsert }   from "./nodeSupport";


const specName = 'hr'   // name determined internally by `markdown-it.parserBlock

type HRAction = GenericActions & {
   addHR: Action
}

export const horizontal_rule:NodeDef<HRAction> = {
   specName,
   pasteRules: [],
   inputRules: [hrInputRule],
   keys: () => ({
      'Shift-Meta-_': horizontal_rule.actions.addHR
   }),
   actions:   { 
      addHR: addHorizontalRule
   },
   schemaSpec: {
      group:      'block',
      parseDOM:   [{tag: 'hr'}],
      toDOM() { return ['div', ['hr']] }
   },
   toMarkdown(state, node) {
      state.write(node.attrs['markup'] || '---');
      state.closeBlock(node);
   },
   fromMarkdown: { 
      [specName]: { node: specName } 
   },
}

function hrInputRule(type:NodeType) {
   return new InputRule(/^(?:---|___\s|\*\*\*\s)$/,
      (state, match, start, end) => {
         if (!match[0]) return null;
         let tr = state.tr.replaceWith(start - 1, end, type.createChecked());
         // Find the paragraph that contains the "---" shortcut text, we need
         // it below for deciding whether to insert a new paragraph after the
         // hr.
         const $para = state.doc.resolve(start);

         let insertParaAfter = false;
         if ($para.end() != end) {
            // if the paragraph has more characters, e.g. "---abc", then no
            // need to insert a new paragraph
            insertParaAfter = false;
         } else if ($para.after() == $para.end(-1)) {
            // if the paragraph is the last child of its parent, then insert a
            // new paragraph
            insertParaAfter = true;
         } else {
            const nextNode = state.doc.resolve($para.after()).nodeAfter!;
            // if the next node is a hr, then insert a new paragraph
            insertParaAfter = nextNode.type === type;
         }
         return insertParaAfter
            ? safeInsert(state.schema.nodes['paragraph'].createChecked(), tr.mapping.map($para.after()))(tr)
            : tr;
      }
   )
}

function addHorizontalRule():Command {
   return (state:EditorState, dispatch?: (tr:Transaction)=>void) => {
      const type = state.schema.nodes.paragraph
      dispatch?.(state.tr.replaceSelectionWith(type.create()).scrollIntoView())
      return true
   }
}
