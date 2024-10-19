/**
 * ## Grid
 * Fills the width and height of the parent with a grid.
 * All regular css grid styles can be added in the `styles` parameter
 * (in React notation). the styles `columns` and `rows` are shorthand for 
 * `grid-template-columns` and `grid.template-rows`. 
 * If the grid is defined in either row or column direction, and if the 
 * cell sizes are specified in `%`, the setting `moveable={true}` will 
 * add controls to the cell borders for dynamic resizing.
 * 
 * # Example
 * ```
 * function GridExample() {
 *    return <Grid style={{columns:'20% 60% 20%'}} moveable={true} className={styles.example}>
 *       <div className={styles.col}>{`column 1`}</div>
 *       <Grid style={{rows:"40% 30% 30%"}} moveable={true} className={styles.col}>
 *          <div className={styles.row}>{`row 1`}</div>
 *          <div className={styles.row}>{`row 2`}</div>
 *          <div className={styles.row}>{`row 3`}</div>
 *       </Grid>
 *       <div className={styles.col}>{`column 3`}</div>
 *    </Grid>
 * }
 * ```
 * ![Grid example](/examples/Grid.png)
 * 
 * @module
 */

'use client'
import { CSSProperties, MouseEvent, TouchEvent, useRef, useState } 
                        from 'react'
import styles           from './Grid.module.scss'
import { BaseProps }    from '@hauke5/components/BaseProps';


const MIN_SIZE = 5;  // dont resize to less than 5%


interface Drag {
   pos:     number   // x/y position of mouseDown
   orgPos:  number   // % position of handle at mouseDown
   index:   number   // handle index in position[] 
   size:    number   // size of parent
}

export interface GridStyleProperties extends Omit<CSSProperties, 'rows'|'columns'> {
   rows?:         string
   columns?:      string
}
interface GridProps extends Omit<BaseProps, 'style'> {
   /** 
    * makes cell borders moveable. 
    * If ommitted or `false`, grid borders are not moveable.
    * If a function is provided, the function will be called after a border has been moved.
    */
   moveable?:  boolean | (()=>void)
   style:      GridStyleProperties
}
/**
 * organizes its `children` in a grid. 
 * Add `moveable` to make the grid cells resizable. This works only when using `style` 
 * to set the cell sizes as a percentage since these values will be programmatically changed when resized. E.g.:
 * ```
 *    const style = {columns:'20% 60% 20%'}
 *    return <Grid style={style} ...
 * ```
 */
export function Grid({style, moveable=false, children, className, ...props}: GridProps) {
   // we need a per-grid drag object to avoid moving all grid borders at once
   const drag  = useRef<Drag>({ pos:0, orgPos:0, index:-1, size:0 })
   const {hor, gridStyle, positions, setPositions} = usePositions(style??{}, moveable)
   
   return <div style={gridStyle} className={`${styles.grid} ${className ?? ''}`} {...props}
      onMouseDown={startDrag(positions, hor, drag.current)}  onMouseMove={inMouseDrag} onMouseUp={endDrag}
      onTouchStart={startDrag(positions, hor, drag.current)} onTouchMove={inTouchDrag} onTouchEnd={endDrag}>
   {moveable && positions.map((c,i) => i>0 && 
         <div key={i} className={`${styles.moveable} ${hor?styles.hor:styles.ver} moveable${i}`} 
            style={{[hor?'left':'top']:`${positions[i-1]}%`}}
         />
      )}
      {children}
   </div>

   function inTouchDrag(e:TouchEvent) { inDrag(e, e.touches?.[0].clientX, e.touches?.[0].clientY) }
   function inMouseDrag(e:MouseEvent) { inDrag(e, e.clientX, e.clientY) }
   function inDrag(e:MouseEvent|TouchEvent, x:number, y:number) {
      if (drag.current.index>=0) { 
         e.preventDefault()
         // e.stopPropagation()
         setPositions(positions => updatePosition(positions, x, y))
         if (typeof moveable === 'function') moveable()  // notify of resizing
      }  
   }
   function updatePosition(positions:number[], x:number, y:number) {
      const d = drag.current
      const pct = d.orgPos + Math.round(1000*((hor?x:y)-d.pos)/(d.size??1))/10
      const min = d.index>0? positions[d.index-1] : 0
      const max = d.index<positions.length-1?  positions[d.index+1] : 100
      // don't allow positions less than MIN_SIZE width
      const pNew = Math.min(max-MIN_SIZE, Math.max(min+MIN_SIZE, pct))
      return positions.map((p,i) => i===d.index? pNew : p)
   }
   function endDrag() {
      if (drag.current.index>=0) {
         drag.current.index = -1
         if (typeof moveable === 'function') moveable()  // notify of resizing
      }
   }
}

/** 
 * converts a css template string into an array of %-widths
 * called when initializing `positions` state, before anything happens 
 */
function usePositions(style:any, moveable:boolean | (() => void)) {
   const canonicStyle = renameAttr(style)
   const hor = canonicStyle.gridTemplateColumns? true : false
   const template = hor?'gridTemplateColumns':'gridTemplateRows'
   const [positions, setPositions] = useState<number[]>(getSizes(canonicStyle[template]))
   const gridStyle:any  = Object.assign({}, canonicStyle, moveable? {[template]: updateGridTemplate(positions)}:undefined)
   return {hor, gridStyle, positions, setPositions}
}

function getSizes(sizestring:string) {
   const sizes:string[] = sizestring?.replace(/%/g,'').split(' ') ?? []
   let sum=0;
   return sizes.map(s => Math.min(100, sum+=+s))
}

/** creates a new `grid-...-template` string from the `positions` array */
function updateGridTemplate(positions:number[]):string {
   return positions.map((c,i)=>`${Math.round(10*(positions[i] - (i? positions[i-1] : 0)))/10}%`).join(' ')
}

/** start a drag if not already in a drag */
function startDrag(positions:number[], hor:boolean, drag:Drag){ return (e:MouseEvent|TouchEvent) => {
   if (drag.index<0) {
      // e.preventDefault()
      // e.stopPropagation()
      const {pos, index, size} = getCoords(e, hor)
      if (index>=0) drag = Object.assign(drag, {pos, orgPos:positions[index], index, size})
   }
}}


function getCoords(e:MouseEvent|TouchEvent, hor:boolean) {
   const x = (e as MouseEvent).clientX ?? (e as TouchEvent).touches[0].clientX
   const y = (e as MouseEvent).clientY ?? (e as TouchEvent).touches[0].clientY
   const target = e.target as HTMLElement
   const p = target.parentNode as HTMLElement
   const colClass = Array.from(target.classList).find(c => c.search(/^moveable(\d)+$/)>=0)
   const index = colClass? +colClass.slice('moveable'.length)-1 : -1
   return {pos:hor?x:y, size:hor? p.clientWidth : p.clientHeight, index}
}

/**
 * renames attributes in `style` by adding the new name and deleting the old.
 * For each `from` key in `attReps`,
 * 1. a new key `attReps[from]` will be added in `style` with its value copied from `style[from]`
 * 2. its entry will be deleted in `style`
 * For example: 
 * ```
 * style = { columns: 'bla' }
 * renameAttr(style, {columns:'gridTemplateColumns'})
 * // -> style = { gridTemplateColumns: 'bla' } 
 * ```
 * @param style an object literal that describes a css style
 * @param attReps an object literal with replacement key-value pairs
 */
function renameAttr(style:any) {
   const attReps = {columns:'gridTemplateColumns', rows:'gridTemplateRows', areas:'gridTemplateAreas'}
   Object.keys(attReps).forEach(from => {
      if (style[from as keyof typeof attReps]) {
         const val = style[from]
         delete style[from]
         style[attReps[from as keyof typeof attReps]] = val
      }
   })
   return style
}

