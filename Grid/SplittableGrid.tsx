'use client'

import { mdiClose }  from '@mdi/js';
import { Rerender, useLog, useRerender } 
                     from '@hauke5/lib/hooks';
import { ReactElement, ReactNode, useEffect, useRef }  
                     from 'react';
import { Icon }      from '../Icon';
import { BaseProps } from '@hauke5/components/BaseProps';
import { Grid }      from './Grid';
import styles        from './SplittableGrid.module.scss'


export interface Leaf extends ReactElement<{LeafID:string}> {
}


export interface SplittableGridProps extends Omit<BaseProps, 'children'> {
   /** 
    * calls parent with an ID for a `ReactNode` to render. 
    * This function will be called each time a `Leaf` is rendered. Callers can either cache the content or 
    * provide an updated render.
    * If `remove` is true, signals parent that the ID is being removed and allows the parent 
    * to perform any cleanup operations.
    */
   childAt: (id:string, remove?:boolean)=>ReactNode
   /** show grid extension affordances at top or bottom edge of panel */
   posTop?: boolean
   /** show grid extension affordances at left or right edge of panel */
   posLeft?:boolean
}
/**
 * ## SplittableGrid
 * creates an initial cell that can be recursively split horizontally or vertically. Each cell features
 * an affordance for splitting in each direction, as well as for removing a cell.
 * The calling function will be prompted for the content to display n each cell via the `childAt` callback.
 * ### Parameters:
 * - `childAt`: calls parent with a unique ID and expects it to return a `ReactNode` to render. 
 *    This function will be called each time a `Leaf` is rendered. Callers can either cache the content or 
 *    provide an updated render.
 *    If `remove` is true, signals parent that the ID is being removed and allows the parent 
 *    to perform any cleanup operations.
 * - `posTop`, `posLeft`: determines the vertical, resp. horizontal position of the extension handles. 
 */
export function SplittableGrid({childAt, posTop=true, posLeft=true, ...props}:SplittableGridProps) {
   const rerender = useRerender()
   const log = useLog('SplittableGrid2')
   const rootNode = useRef<Split>()
   useEffect(() => {
      if (!rootNode.current) rootNode.current = addChild(null, undefined, childAt, rerender)
   }, [childAt, rerender])
   log.debug(()=>`tree, ${countLeaves(rootNode.current)} nodes: ${rootNode.current? traverseNodeTree(rootNode.current) : ''}`)
   return <SplitGrid key={`a${rerender.count()}`} node={rootNode.current} {...props}/>

   /** 
    * adds a new child to `leaf` in the `dir` direction, thereyby making  
    * `leaf` a new `SplitNode` and transferring its `content` to `leaf.first`.
    * `leaf.second` will contain the new content
    */

   /**
    * removes the specified `leaf` from the tree, 
    * transferring it's identity to its parent.
    */
   function removeChild(leaf:SplitLeaf) {
      const parent = leaf.parent 
      if (!parent) {
         log.warn(`can't remove root node`)
         return
      }
      // allow calling function to clean up 
      childAt(leaf.id, true)  

      // find surviving leaf
      const child = (leaf === parent.first)
         ? parent.second as Split
         : parent.first as Split

      // set parent to surviving node
      if (child.split === Dir.none) { // node is a SplitLeaf
         setChildLeafToParent(child, parent)
      } else {                        // node is SplitNode
         setChildNodeToParent(child, parent)
      }
      rerender()
   }

   function setChildLeafToParent(child:SplitLeaf, parent:SplitNode) {
      const parentLeaf = parent as unknown as SplitLeaf
      parentLeaf.id = child.id
      // parentLeaf.content = child.content
      parentLeaf.split = child.split
      if (parent.first) delete parent.first
      if (parent.second) delete parent.second
   }
   function setChildNodeToParent(child:SplitNode, parent:SplitNode) {
      parent.split  = child.split
      parent.first  = child.first
      parent.second = child.second
      if (parent.first) parent.first.parent = parent
      if (parent.second) parent.second.parent = parent
   }

   /**
    * recursively renders `SplitNodes` and terminates on `SplitLeafs`.
    */
   function SplitGrid({node, ...props}:SplitGridProps) {
      if (!node) return <></>

      if (node.split===Dir.none) {
         return <Leaf changeTree={changeTree} {...props}>{childAt(node.id)}</Leaf>
      } else {
         const style = node.split===Dir.horizontal? 'columns' : 'rows'
         return <Grid moveable={true} style={{[style]:'50% 50%'}} >
            <SplitGrid key={`first`}  node={node.first}  {...props} />
            <SplitGrid key={`second`} node={node.second} {...props} />
         </Grid>
      } 

      function changeTree(type:ExtType) {
         const leaf = node as SplitLeaf
         if      (type===ExtType.bottom) addChild(leaf, Dir.vertical, childAt, rerender)
         else if (type===ExtType.right)  addChild(leaf, Dir.horizontal, childAt, rerender)
         else if (type===ExtType.close)  removeChild(leaf)
      }
   }

   /** overlays extension buttons on the `children`content */
   function Leaf({children, changeTree, ...props}:LeafProps) {
      return <div className={styles.leafFrame} {...props}>
         {children}
         <Actions />
      </div>

      function onClick(ext:ExtType) {
         return () => changeTree(ext)
      }

      /** display affordances to extend or remove grid elements */
      function Actions() {
         const getClass = (c:string) => `${c} ${posTop?styles.top:''} ${posLeft?'':styles.right}`
         return <div className={getClass(styles.actions)}>
            <div className={getClass(styles.extendLR)} onClick={onClick(ExtType.right)} />
            <div className={getClass(styles.extendTB)} onClick={onClick(ExtType.bottom)} />
            <div className={getClass(styles.close)} onClick={onClick(ExtType.close)} >
               <Icon mdi={mdiClose} size={20}/>
            </div>
         </div>
      }  
   }
}

function addChild(leaf:SplitLeaf|null, dir:Dir.vertical|Dir.horizontal=Dir.horizontal, childAt:(id:string, remove?:boolean)=>ReactNode, rerender:Rerender):SplitLeaf {
   const node = leaf as unknown as SplitNode
   const newID = `@${Math.round(Math.random()*10000000)}`
   const newLeaf:SplitLeaf = {split:Dir.none, parent:node, id:newID}
   childAt(newLeaf.id) // add leaf here so the refreshs reflect the latest number of leaves
   if (leaf) { // not the root
      node.split = dir
      node.first = {split:Dir.none, parent:node, id:leaf.id}
      node.second = newLeaf
      leaf.id = ''
      // delete leaf.content
   }
   rerender()
   return newLeaf
}



function traverseNodeTree(node:Split):string {
   let dir:string
   switch(node.split) {
      case Dir.none: return `Leaf ${node.id}`
      case Dir.horizontal: dir = 'hor'; break
      case Dir.vertical:   dir = 'ver'; break
   }
   return `[${dir}: ${traverseNodeTree(node.first as Split)} | ${traverseNodeTree(node.second as Split)}]` 
}

function countLeaves(node:Split|undefined):number {
   if (!node) return 0
   if (node.split === Dir.none) return 1
   return countLeaves(node.first as Split) + countLeaves(node.second as Split)
}



enum Dir {
   none,
   horizontal,
   vertical,
}

enum ExtType {
   right,
   bottom,
   close
}

interface SplitShared {
   split:   Dir
   parent:  SplitNode | null
}

interface SplitNode extends SplitShared {
   /** the first child, populated by the original leaf during a split  */
   first?:    SplitNode | SplitLeaf
   /** the second child, populated by a new leaf during a split */
   second?:   SplitNode | SplitLeaf
   /** the direction of the split */
   split:   Dir.horizontal | Dir.vertical
}

interface SplitLeaf extends SplitShared {
   id:      string
   // content: ReactNode
   split:   Dir.none
}

interface LeafProps extends BaseProps {
   changeTree: (type:ExtType)=>void
}

interface SplitGridProps extends Omit<BaseProps, 'children'> {
   node:          Split | undefined
}

type Split = SplitNode | SplitLeaf
