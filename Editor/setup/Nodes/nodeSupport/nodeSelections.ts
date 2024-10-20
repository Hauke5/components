import { NodeSelection, Selection, Transaction } 
                              from "prosemirror-state";
import { Node }               from "prosemirror-model";
import { isSelectableNode }   from "./nodeQueries";

/** Checks if current selection is a `NodeSelection` */
export const isNodeSelection = (selection:Selection):boolean => selection instanceof NodeSelection

type NodeCondition = {(node: Node): boolean}
type NodeWithPos = {
   pos:     number, 
   node:    Node
}

/**
 * Returns a transaction that changes the type, attributes, and/or marks of the parent node of a given `nodeType`.
 * ```javascript
 * const node = schema.nodes.extension.createChecked({});
 * dispatch(
 *   setParentNodeMarkup(schema.nodes.panel, null, { panelType })(tr);
 * );
 * ```
 */
// export const setParentNodeMarkup = (nodeType:NodeType, type?:NodeType|null, attrs?:any, marks?:Mark[]) => (tr:Transaction):Transaction => {
//    const parent = findParentNodeOfType(nodeType, tr.selection)
//    if (parent) tr = tr.setNodeMarkup(parent.pos, type, Object.assign({}, parent.node.attrs, attrs), marks)
//    return tr
// }

/**
 * Returns a new transaction that sets a `NodeSelection` on a parent node of a given `nodeType`.
 * ```javascript
 * dispatch(
 *   selectParentNodeOfType([tableCell, tableHeader])(state.tr)
 * );
 * ```
 */
// export const selectParentNodeOfType = (nodeType:NodeType) => (tr:Transaction):Transaction => {
//    if (!isNodeSelection(tr.selection)) {
//       const parent = findParentNodeOfType(nodeType, tr.selection)
//       if (parent) tr = tr.setSelection(NodeSelection.create(tr.doc, parent.pos))
//    }
//    return tr;
// };

/**
 * Returns a new transaction that tries to find a valid cursor selection (if any) 
 * starting at the given `position` and searching in the `dir` direction.
 */
export const setTextSelection = (position:number, dir:'forward'|'backward' = 'forward') => (tr:Transaction):Transaction => {
   const nextSelection = Selection.findFrom(tr.doc.resolve(position), dir==='forward'?1:-1, true);
   if (nextSelection) return tr.setSelection(nextSelection)
   return tr;
};

const shouldSelectNode = (node:Node):boolean => isSelectableNode(node) && node.type.isLeaf;

/**
 * Returns a new transaction sets the selection to 
 * - a node, if it is selectable
 * - the text at position `pos`
 */
export const setSelection = (node:Node, pos:number, tr:Transaction):Transaction =>
   shouldSelectNode(node)
      ? tr.setSelection(new NodeSelection(tr.doc.resolve(pos)))
      : setTextSelection(pos)(tr);

/**
* Flattens descendants of a given prosemirror `node`. 
* If `descend` is `false` (default:`true`), no further descent into the node will occur.
*/
export const flattenNode = (node:Node, descend=true):NodeWithPos[] => {
   const result = [] as { node:Node, pos: number }[]
   node.descendants((child, pos) => {
      result.push({ node: child, pos });
      if (!descend) return false
   })
   return result;
}

/** Returns child nodes of the the prosemirror Node `node` for which `condition` returns truthy */
export const findChildren = (node:Node, condition:NodeCondition, descend:boolean):NodeWithPos[] =>
   flattenNode(node, descend).filter(child => condition(child.node))
