import { liftListItem, wrapInList } 
                           from "prosemirror-schema-list";
import { Node, NodeRange, NodeType }           
                           from "prosemirror-model";
import { Command, EditorState, Transaction }     
                           from "prosemirror-state";
import { hasParentNodeOfType, isDirectParentActive, flattenNode }     
                           from "../nodeSupport";


const isListItem = (node:Node|null) => 
   node?.type.name==='listItem'

export const isNodeTodo = (node:Node|null) => 
   isListItem(node) && typeof node?.attrs['todoChecked'] !== undefined

/**
 * remove todoChecked attribute from a listItem
 * no-op if not listitem
 */
export const removeTodoCheckedAttr = (tr:Transaction, node:Node, pos:number) =>
   isNodeTodo(node)
      ? tr.setNodeMarkup(pos, undefined, Object.assign({}, node.attrs, { todoChecked:null, todoCreated:null, todoClosed:null }))
      : tr

/**
 * set todoChecked attribute (as false) to a listItem
 * no-op if not listitem or if already todo
 */
export const setTodoCheckedAttr = (tr:Transaction, node:Node, pos:number) =>
   isListItem(node) && !isNodeTodo(node)
      ? tr.setNodeMarkup(pos, undefined, Object.assign({}, node.attrs, { todoChecked: false, todoCreated:null, todoClosed:null }))
      : tr

export function isListActive(type:NodeType) {
   return (state: EditorState):boolean => {
      const itemType = state.schema.nodes['listItem']
      return isDirectParentActive(itemType, type)(state)
   }
}

export function toggleList(todo:boolean=false) {
   return (type:NodeType):Command => (state, dispatch) => {
      if (isListActive(type)(state)) {
         return liftListItem(type)(state, dispatch)
      } else
         return wrapInList(type)(state, dispatch)
   }
}


export function outdentList(type: NodeType): Command {
   return function (state, dispatch, view) {
      const listNode = state.schema.nodes['listItem']
      let listItem = type;
      if (!listItem) listItem = listNode
      const { $from, $to } = state.selection;
      if (!isInsideListItem(listItem)(state)) return false
      // if we're backspacing at the start of a list item, unindent it
      // take the the range of nodes we might be lifting

      // the predicate is for when you're backspacing a top level list item:
      // we don't want to go up past the doc node, otherwise the range
      // to clear will include everything
      let range = $from.blockRange($to,
         (node) => node.childCount > 0 && node.firstChild!.type === listItem);

      if (!range) return false

      const isGreatGrandTodo = isNodeTodo(state.selection.$from.node(-3));

      // TODO this is not quite as lean as the indent approach of todo
      // check if we need to set todoCheck attribute
      if (dispatch && view) {
         const grandParent = state.selection.$from.node(-2);
         const grandParentPos = state.selection.$from.start(-2);
         let tr = state.tr;
         for (const { node, pos } of flattenNode(grandParent, false)) {
            const absPos = pos + grandParentPos;
            // -1 so that we cover the entire list item
            if (absPos >= state.selection.$from.before(-1) && absPos < state.selection.$to.after(-1)) {
               if (isGreatGrandTodo) setTodoCheckedAttr(tr, node, absPos);
                             else removeTodoCheckedAttr(tr, node, absPos);
            }
         }
         dispatch(tr);
         state = view.state;
      }

      // 1. First lift list item
      // 2. Check if I need to merge nearest list
      const composedCommand = compose(mergeLists(listItem, range), liftListItem)(listItem);
      return composedCommand(state, dispatch, view);
   };
}

function compose(...allFuncs: Function[]) {
   return (raw: any) => allFuncs.reduceRight((prev, func) => func(prev), raw)
}

const isInsideListItem = (type: NodeType | undefined) => (state: EditorState):boolean => {
   const { $from } = state.selection;
   const listNode = state.schema.nodes['listItem']
   let listItem = type;
   if (!listItem) listItem = listNode
   const { paragraph } = state.schema.nodes;
   // if (state.selection instanceof GapCursorSelection) return $from.parent.type === listItem
   return hasParentNodeOfType(listItem)(state.selection) && $from.parent.type === paragraph
}

function mergeLists(listItem: NodeType, range: NodeRange): (command: Command) => Command {
   return (command: Command) => {
      return (state, dispatch, view) => {
         const newDispatch = (tr: Transaction) => {
            /* we now need to handle the case that we lifted a sublist out,
               * and any listItems at the current level get shifted out to
               * their own new list; e.g.:
               *
               * unorderedList
               *  listItem(A)
               *  listItem
               *    unorderedList
               *      listItem(B)
               *  listItem(C)
               *
               * becomes, after unindenting the first, top level listItem, A:
               *
               * content of A
               * unorderedList
               *  listItem(B)
               * unorderedList
               *  listItem(C)
               *
               * so, we try to merge these two lists if they're of the same type, to give:
               *
               * content of A
               * unorderedList
               *  listItem(B)
               *  listItem(C)
               */
            const $start = state.doc.resolve(range.start);
            const $end = state.doc.resolve(range.end);
            const $join = tr.doc.resolve(tr.mapping.map(range.end - 1));
            if ($join.nodeBefore && $join.nodeAfter && $join.nodeBefore.type === $join.nodeAfter.type) {
               if ($end.nodeAfter && $end.nodeAfter.type === listItem && $end.parent.type === $start.parent.type)
                  tr.join($join.pos)
            }
            if (dispatch) dispatch(tr.scrollIntoView())
         };
         return command(state, newDispatch, view);
      };
   };
}
