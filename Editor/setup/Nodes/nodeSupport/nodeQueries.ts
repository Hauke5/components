import { Node, NodeType }  from 'prosemirror-model'
import { EditorState, Selection }       from 'prosemirror-state'
import { CommandQuery }    from '../../utils'

type NodeCondition = {(node:Node): boolean}
type NodeWithPos = {
   pos: number, 
   node: Node
};
type ContentNodeWithPos = NodeWithPos & {
   start?:  number, 
   depth:   number, 
}

export const isSelectableNode = (node:Node):boolean => node.type?.spec.selectable ?? false;


export function isDirectParentActive(type:NodeType, parentType:NodeType) {
      return parentHasDirectParentOfType(type, [parentType])
}

export const hasParentNode = (condition:NodeCondition) =>
   (selection:Selection):boolean => !!findConditionalParentNode(condition, selection)



/** Checks if the type a given `node` equals to a given `nodeType`  */
export const equalNodeType = (nodeType:NodeType|NodeType[], node:Node):boolean =>
   (nodeType as NodeType[]).includes?.(node.type) || node.type === nodeType

/**
 * Returns parent node of a given `nodeType` closest to `selection`.
 * `start` points to the start position of the node, `pos` points directly before the node.
 * ```javascript
 * const parent = findParentNodeOfType(schema.nodes.paragraph, selection);
 * ```
 */
export const findParentNodeOfType = (type:NodeType, selection:Selection):ContentNodeWithPos|null =>
   findConditionalParentNode((node:Node) => equalNodeType(type, node), selection)



/**
 * Returns position of the previous node.
 *
 * ```javascript
 * const pos = findPositionOfNodeBefore(tr.selection);
 * ```
 */
export function findPositionOfNodeBefore(selection:Selection):number {
   const { nodeBefore } = selection.$from;
   const maybeSelection = Selection.findFrom(selection.$from, -1);
   if (maybeSelection && nodeBefore) {
      // leaf node
      const parent = findParentNodeOfType(nodeBefore.type, maybeSelection);
      if (parent) return parent.pos
      return maybeSelection.$from.pos;
   }
   return 0
}

/**
 * Returns the prosemirror parent node closest to `$from` that satisfies `condition`.
 * `start` points to the start position of the node, `pos` points directly before the node.
 * ```javascript
 * const condition = node => node.type === schema.nodes.blockquote;
 * const parent = findParentNode(condition)(selection);
 * ```
 */
export const findConditionalParentNode = (condition:NodeCondition, {$from}:Selection):ContentNodeWithPos|null => {
      for (let i = $from.depth; i > 0; i--) {
         const node = $from.node(i);
         if (condition(node)) return {
            pos:     i > 0 ? $from.before(i) : 0,
            start:   $from.start(i),
            depth:   i,
            node
         }
      }
      return null
}



/**
 * Finds a parent node in the ancestors and check if that node has a direct parent of type `parentsParentType`
 */
export function parentHasDirectParentOfType(parentType: NodeType, parentsParentType: NodeType | NodeType[]): CommandQuery {
   parentsParentType = Array.isArray(parentsParentType) ? parentsParentType : [parentsParentType];

   return (state):boolean => {
      const currentResolved = findParentNodeOfType(parentType, state.selection);
      if (!currentResolved) return false

      const depth = currentResolved.depth - 1;
      if (depth < 0) return false

      const parentsParent = state.selection.$from.node(depth);
      return (parentsParentType as NodeType[]).includes(parentsParent.type);
   };
}



/** Checks if a given `node` is an empty paragraph */
export const isEmptyParagraph = (node:Node) => {
  return !node || (node.type.name === 'paragraph' && node.nodeSize === 2)
};

export const checkInvalidMovements = (originIndex:number, targetIndex:number, targets:number[], type:string):boolean => {
   const direction = originIndex > targetIndex ? -1 : 1;
   const errorMessage = `Target position is invalid, you can't move the ${type} ${originIndex} to ${targetIndex}, the target can't be split. You could use tryToFit option.`;

   if (direction === 1) {
      if (targets.slice(0, targets.length - 1).indexOf(targetIndex) !== -1) throw new Error(errorMessage)
   } else {
      if (targets.slice(1).indexOf(targetIndex) !== -1) throw new Error(errorMessage)
   }
   return true
}

/** Returns false if node contains only empty inline nodes and hardBreaks */
export function hasVisibleContent(node: Node):boolean {
   const isInlineNodeHasVisibleContent = (inlineNode: Node) => {
      return inlineNode.isText
         ? !!inlineNode.textContent.trim()
         : inlineNode.type.name !== 'hardBreak';
   };
   if (node.isInline) {
      return isInlineNodeHasVisibleContent(node);
   } else if (node.isBlock && (node.isLeaf || node.isAtom)) {
      return true;
   } else if (!node.childCount) {
      return false;
   }
   for (let index = 0; index < node.childCount; index++) {
      const child = node.child(index);
      if (hasVisibleContent(child)) return true;
   }
   return false;
}

/** Checks if a node has any content. Ignores node that only contain empty block nodes. */
export function isNodeEmpty(node: Node):boolean {
   if (node && node.textContent) return false;
   if (!node || !node.childCount || (node.childCount === 1 && isEmptyParagraph(node.firstChild!)))
      return true

   const block: Node[] = [];
   const nonBlock: Node[] = [];
   const multiChild = (childNode:Node) => (!!childNode.childCount && !(childNode.childCount === 1 && isEmptyParagraph(childNode.firstChild!))) || childNode.isAtom
   node.forEach((child) => child.isInline ? nonBlock.push(child) : block.push(child));
   return (!nonBlock.length && !block.filter(multiChild).length);
}

export function hasParentNodeOfType(nodeType:NodeType) {
   return (selection:Selection):boolean =>
      hasParentNode(node => equalNodeType(nodeType, node))(selection);
}


