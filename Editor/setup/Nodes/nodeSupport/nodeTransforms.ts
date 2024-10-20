import { NodeSelection, Transaction } 
                           from 'prosemirror-state';
import { Fragment, Node, NodeType, ResolvedPos, Slice }  
                           from 'prosemirror-model';
import { isNodeSelection, setSelection, setTextSelection } 
                           from './nodeSelections';
import { findParentNodeOfType, findPositionOfNodeBefore, isEmptyParagraph, isSelectableNode } 
                           from '..';



/**
 * Returns a transaction that removes a node of a given `nodeType`, if any.
 * ```javascript
 * const removeTable = removeParentNodeOfType(schema.nodes.table)
 * dispatch(removeTable(tr))
 * ```
*/
export const removeParentNodeOfType = (nodeType:NodeType) => (tr:Transaction):Transaction => {
   const parent = findParentNodeOfType(nodeType, tr.selection)
   return parent ? removeNodeAtPos(parent.pos)(tr) : tr
}

/**
 * Returns a new transaction that replaces parent node of a given `nodeType` with the given `content`. 
 * It will return an original transaction if either parent node hasn't been found or replacing is not possible.
 * ```javascript
 * const node = schema.nodes.paragraph.createChecked({}, schema.text('new'));
 * dispatch(replaceParentNodeOfType(schema.nodes.table, node)(tr));
 * ```
 */
export const replaceParentNodeOfType = (nodeType:NodeType, content:Node|Fragment) => (tr:Transaction):Transaction => {   
   const parent = findParentNodeOfType(nodeType, tr.selection);
   if (parent) {
      const newTr = replaceNodeAtPos(parent.pos, content)(tr);
      if (newTr !== tr) return newTr;
   }
   return tr;
};

/** 
 * Returns a `delete` transaction that removes a node at a given position with the given `node`.
 * `position` should point at the position immediately before the node.
 */
export const removeNodeAtPos = (position:number) => (tr:Transaction): Transaction => {
   const node = tr.doc.nodeAt(position);
   return tr.delete(position, position + (node?.nodeSize??0))
};

/** Returns a new transaction that removes selected node, if any */
export const removeSelectedNode = (tr:Transaction):Transaction =>
   isNodeSelection(tr.selection)
      ? tr.delete(tr.selection.$from.pos, tr.selection.$to.pos) 
      : tr

/** 
 * Returns a `replace` transaction that replaces a node at a given position with the given `content`.
 * `position` should point at the position immediately before the node.
 */
export const replaceNodeAtPos = (position:number, content:Node|Fragment) => (tr:Transaction):Transaction => {
   const node = tr.doc.nodeAt(position);
   const $pos = tr.doc.resolve(position);
   if (canReplace($pos, content)) {
      tr = tr.replaceWith(position, position + (node?.nodeSize??0), content);
      const start = tr.selection.$from.pos - 1;
      // put cursor inside of the inserted node
      tr = setTextSelection(Math.max(start, 0), 'backward')(tr);
      // move cursor to the start of the node
      tr = setTextSelection(tr.selection.$from.start())(tr);
   }
   return tr;
};

/** 
 * Returns a transaction that replaces the selected node with a given `node`, 
 * keeping NodeSelection on the new `node` 
 */
export const replaceSelectedNode = (content:Node|Fragment) => (tr:Transaction):Transaction => {
   if (isNodeSelection(tr.selection)) {
      const { $from, $to } = tr.selection
      if ((content instanceof Fragment && $from.parent.canReplace($from.index(), $from.indexAfter(), content)) 
       || (content instanceof Node && $from.parent.canReplaceWith($from.index(), $from.indexAfter(), content.type)))
      tr = tr
         .replaceWith($from.pos, $to.pos, content)
         // restore node selection
         .setSelection(new NodeSelection(tr.doc.resolve($from.pos)))
   }
   return tr;
};


/**
 * Returns a new transaction that inserts a given prosemirror node `content` at the current cursor position, 
 * or at a given `position`, if it is allowed by schema. If schema restricts such nesting, it will try to 
 * find an appropriate place for a given node in the document, looping through parent nodes up until the root document node.
 * If `tryToReplace` is `true` (default: `false`) and current selection is a `NodeSelection`, it will replace selected node 
 * with inserted content if its allowed by schema.
 * If the cursor is inside an empty paragraph, it will try to replace that paragraph with the given content. 
 * If insertion is successful and inserted node has content, it will set cursor inside of that content.
 * ```javascript
 * const node = schema.nodes.extension.createChecked({});
 * dispatch(safeInsert(node)(tr))
 * ```
 */
export const safeInsert = (content:Node, position?:number, tryToReplace=false) => (tr:Transaction):Transaction => {
   const hasPosition = typeof position === 'number';
   const { $from } = tr.selection;
   const $insertPos = hasPosition
      ? tr.doc.resolve(position)
      : isNodeSelection(tr.selection)
         ? tr.doc.resolve($from.pos + 1)
         : $from;
   const { parent } = $insertPos;

   // try to replace selected node
   if (isNodeSelection(tr.selection) && tryToReplace) {
      const oldTr = tr;
      tr = replaceSelectedNode(content)(tr);
      if (oldTr !== tr) return tr
   }

   // try to replace an empty paragraph
   if (isEmptyParagraph(parent)) {
      const oldTr = tr;
      tr = replaceParentNodeOfType(parent.type, content)(tr);
      if (oldTr !== tr) {
         // for selectable node, selection position would be the position of the replaced parent
         const pos = isSelectableNode(content)? $insertPos.before($insertPos.depth) : $insertPos.pos;
         return setSelection(content, pos, tr);
      }
   }

   // given node is allowed at the current cursor position
   if (canInsert($insertPos, content)) {
      tr.insert($insertPos.pos, content);
      const pos = hasPosition
         ? $insertPos.pos
            // for atom nodes selection position after insertion is the previous pos
         : isSelectableNode(content) ? tr.selection.$anchor.pos-1 : tr.selection.$anchor.pos;
      return setSelection(content, pos, tr)
   }

   // looking for a place in the doc where the node is allowed
   for (let i = $insertPos.depth; i > 0; i--) {
      const pos = $insertPos.after(i);
      const $pos = tr.doc.resolve(pos);
      if (canInsert($pos, content)) {
         tr.insert(pos, content);
         return setSelection(content, pos, tr)
      }
   }
   return tr;
};

/**
 * Returns a new transaction that deletes previous node.
 * ```javascript
 * dispatch(removeNodeBefore(state.tr))
 * ```
 */
export const removeNodeBefore = (tr:Transaction):Transaction => {
   const position = findPositionOfNodeBefore(tr.selection);
   if (typeof position === 'number') return removeNodeAtPos(position)(tr)
   return tr;
};


type MapFragmentCallback = (node: Node, parent: Node | undefined, index: number) => Node | Node[] | Fragment | null;

export function mapSlice(slice: Slice, callback: MapFragmentCallback) {
   const fragment = mapFragment(slice.content, callback);
   return new Slice(fragment, slice.openStart, slice.openEnd);
}

function mapFragment(content: Fragment, callback: MapFragmentCallback, parent?: Node): Fragment {
   const children:Node[] = [];
   for (let i = 0, size = content.childCount; i < size; i++) {
      const node = content.child(i);
      const transformed = node.isLeaf
         ? callback(node, parent, i)
         : callback(node.copy(mapFragment(node.content, callback, node)), parent, i);
      if (transformed) {
         if (transformed instanceof Fragment) {
            // @ts-ignore @types/prosemirror-model doesn't have Fragment.content
            children.push(...transformed.content);
         } else if (Array.isArray(transformed)) {
            children.push(...transformed);
         } else {
            children.push(transformed);
         }
      }
   }
   return Fragment.fromArray(children);
}


/** Checks if replacing a node at a given `$pos` inside of the `doc` node with the given `content` is possible. */
export const canReplace = ($pos:ResolvedPos, content:Node|Fragment): boolean => {
   const node = $pos.node($pos.depth);
   return node && node.type.validContent(content instanceof Fragment ? content : Fragment.from(content))
};

/** 
 * Checks if a given `content` can be inserted at the given `$pos`
 * ```javascript
 * const { selection: { $from } } = state;
 * const node = state.schema.nodes.atom.createChecked();
 * if (canInsert($from, node)) ...
 * ```
 */
export function canInsert($pos:ResolvedPos, content:Node|Fragment):boolean {
   const index = $pos.index()
   if (content instanceof Fragment)
      return $pos.parent.canReplace(index, index, content)
   else if (content instanceof Node)
      return $pos.parent.canReplaceWith(index, index, content.type)
   return false;
};
