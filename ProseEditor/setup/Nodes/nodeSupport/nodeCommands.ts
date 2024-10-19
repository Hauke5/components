import { wrapInList }      from "prosemirror-schema-list";
import { EditorView }      from "prosemirror-view";
import { ReplaceStep }     from "prosemirror-transform";
import { Fragment, Node, Slice }  
                           from "prosemirror-model";
import { Command, EditorState, NodeSelection, Selection, TextSelection, Transaction } 
                           from "prosemirror-state";
import { lift, setBlockType, wrapIn }    
                           from "prosemirror-commands";
import { paragraph }       from "../paragraph";
import { findParentNodeOfType, parentHasDirectParentOfType } 
                           from "./nodeQueries";
import { safeInsert }      from "./nodeTransforms";



export function nodeIsActive(specName:string):Command {
   return (state: EditorState, dispatch?: (tr:Transaction)=>void) => {
      const type = state.schema.nodes[specName]
      return !!findParentNodeOfType(type, state.selection)
   }
}

export function nodeToggle(specName:string):Command {
   return (state:EditorState, dispatch?: (tr:Transaction)=>void, view?:EditorView) => {
      const type = state.schema.nodes[specName]

      switch(type.name) {
         case 'list': 
         case 'blockquote': 
            if (nodeIsActive(specName)(state)) 
               return lift(state, dispatch, view)
            return wrapIn(type)(state, dispatch, view)
         default:
            if (nodeIsActive(specName)(state)) 
               return paragraph.actions.convertToParagraph()(state, dispatch, view)
            return setBlockType(type)(state, dispatch, view)
         }
   }
}

export function nodeWrapIn(specName:string):Command {
   return (state:EditorState, dispatch?: (tr:Transaction)=>void, view?:EditorView) => {
      const type = state.schema.nodes[specName]
      switch(type.name) {
         case 'list': 
            return wrapInList(type)(state, dispatch, view)
         default:
            return wrapIn(type)(state, dispatch, view)
      }
   }
}


/**
 * Moves a node up or down.
 */
export function nodeMove(downDir:boolean = false):Command {
   return (state:EditorState, dispatch?: (tr:Transaction)=>void, view?:EditorView) => {
      const type = state.schema.nodes.paragraph
      const isTopLevel = parentHasDirectParentOfType(type, state.schema.nodes.doc)
      if (!state.selection.empty || !isTopLevel) return false

      const { $from } = state.selection
      const currentResolved = findParentNodeOfType(type, state.selection)
      if (!currentResolved) return false

      const { node: currentNode } = currentResolved
      const parentDepth = currentResolved.depth - 1
      const parent = $from.node(parentDepth)
      const parentPos = $from.start(parentDepth)

      if (currentNode.type !== type) return false

      const arr = mapChildren(parent)
      let index = arr.indexOf(currentNode)

      let swapWith = downDir ? index + 1 : index - 1

      // If swap is out of bound
      if (swapWith >= arr.length || swapWith < 0) return false

      const swapWithNodeSize = arr[swapWith].nodeSize;
      [arr[index], arr[swapWith]] = [arr[swapWith], arr[index]]

      let tr = state.tr
      let replaceStart = parentPos
      let replaceEnd = $from.end(parentDepth)

      const slice = new Slice(Fragment.fromArray(arr), 0, 0) // the zeros  lol -- are not depth they are something that represents the opening closing
      // .toString on slice gives you an idea. for this case we want them balanced
      tr = tr.step(new ReplaceStep(replaceStart, replaceEnd, slice, false))

      tr = tr.setSelection(Selection.near(tr.doc.resolve(downDir 
         ? $from.pos + swapWithNodeSize 
         : $from.pos - swapWithNodeSize
      )))
      if (dispatch) dispatch(tr.scrollIntoView())
      return true
   }
}


export function nodeJumpToBorder(toStart:boolean=true):Command{
   return (state:EditorState, dispatch) => {
      const type = state.schema.nodes.paragraph
      const current = findParentNodeOfType(type, state.selection)
      if (!current) return false
      if (dispatch) {
         const { node, start } = current;
         const pos = (start??0) + (toStart? 0 : node.content.size)
         dispatch(state.tr.setSelection(TextSelection.create(state.doc, pos)));
      }
      return true;
   }
}

export function nodeCopy():Command {
   return (state, dispatch, view) => {
      const type = state.schema.nodes.paragraph
      const isTopLevel = parentHasDirectParentOfType(type, type.schema.nodes.doc)
      if (!state.selection.empty || !isTopLevel) return false

      const current = findParentNodeOfType(type, state.selection)
      if (!current) return false

      const selection = state.selection
      let tr = state.tr
      tr = tr.setSelection(getParentTextSelection(state, current.depth))

      if (dispatch) dispatch(tr)
      
      navigator.clipboard.writeText(document.getSelection()?.toString()??'')
      // restore the selection
      const tr2 = view!.state.tr
      if (dispatch) dispatch(tr2.setSelection(Selection.near(tr2.doc.resolve(selection.$from.pos))))
      return true
   }
}

export function nodeCut():Command {
   return (state, dispatch) => {
      const type = state.schema.nodes.paragraph
      const isTopLevel = parentHasDirectParentOfType(type, state.schema.nodes.doc)
      if (!state.selection.empty || !isTopLevel) return false

      const parent = findParentNodeOfType(type, state.selection)
      if (!parent?.node) return false
      let tr = state.tr
      tr = tr.setSelection(NodeSelection.create(tr.doc, parent.pos))

      if (dispatch) dispatch(tr)

      const selectedText = document.getSelection()?.toString() ?? ''
      document.getSelection()?.deleteFromDocument()
      navigator.clipboard.writeText(selectedText)
      return true
   }
}

function getParentTextSelection(state: EditorState, currentDepth: number) {
   const { $from } = state.selection;
   const parentPos = $from.start(currentDepth);
   let replaceStart = parentPos;
   let replaceEnd = $from.end(currentDepth);
   return TextSelection.create(state.doc, replaceStart, replaceEnd);
}

/**
 *
 */
export function nodeInsert(insertAbove:boolean=true, attrs?: Node['attrs']):Command {
   return (state, dispatch) => {
      const nestable = false
      const depth = nestable ? -1 : undefined;
      const type = state.schema.nodes.paragraph
      const isTopLevel = parentHasDirectParentOfType(type, type.schema.nodes.doc)
      if (!isTopLevel) return false
      const insertPos = insertAbove
         ? state.selection.$from.before(depth)
         : state.selection.$from.after(depth);
      const nodeToInsert = type.createAndFill(attrs);
      const tr = state.tr;
      let newTr = safeInsert(nodeToInsert!, insertPos)(state.tr);
      if (tr === newTr) return false;
      if (dispatch) dispatch(newTr.scrollIntoView());
      return true;
   }
}


/**
 * Returns an array of the children on `node`
 */
function mapChildren(node: Node | Fragment): Node[] {
   const array:Node[] = [];
   for (let i = 0; i < node.childCount; i++) {
      array.push(node.child(i));
   }
   return array;
}
