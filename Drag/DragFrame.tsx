import { useState, useRef, MouseEvent, createContext, useContext, useEffect } 
                           from 'react';
import { BaseProps }       from '@hauke5/components/BaseProps';
import styles              from './Drag.module.scss'

export interface DragProps extends BaseProps {
   // children:       React.ReactChild | React.ReactChild[]
   stickyness?:    number
   grid?:          number, 
   /**
    * report the position of item at `index`, and receive a potential
    * overruling position back
    */
   location?:     (index:number, x?:number, y?:number)=>{x:number, y:number}|null
}

interface Pos {
   x: number
   y: number
}

interface KeyedPos extends Pos {
   key: number;
}


export interface DragContextProps {
   starter:(index:number) => (e:MouseEvent) => void
}
export const DragContext = createContext<DragContextProps|null>(null)

export function useDragContext(index:number) {
   const dragCtx = useContext(DragContext)
   return {startEvent:dragCtx?.starter(index)}
}

/**
 * Enables dragging of `children` inside the `DrageFrame`.
 * This component manages the positions of all children. When a child is dragged
 * to a new location, the update is communicated via the optional `location` function.
 * This automatic management can be overwritten by providing a `Pos` structure as response to a 
 * call to `location`. 
 * @param className optional css class name
 * @param grid optional grid in pixels, defaults to one. Elements will come to rest on grid points
 * @param stickyness optional, defaults to 0.5. Determines how much an element resists leaviugn a grid point.
 * Values lie between 1 (ideal sticky grid) and 0 (smooth, no stickyness)
 * @param location optional callback function that provides outbound updates on location changes to 
 * each of the children; and retrieves inbound location values to use for rendering
 * @returns 
 */
export function DragFrame({className, stickyness=0.5, grid=1, children, location, ...props}:DragProps) {
   const drag = Math.max(0, Math.min(1, 1-stickyness))
   // const [currKey, setCurrKey] = useState(-1)
   const draggables = children instanceof Array? children : [children]
   const [pos, setPos] = useState<Pos[]>(draggables.map((_,i)=>location?.(i) ?? {x:100, y:100}))
   if (pos.length !== draggables.length) setPos(draggables.map((_,i)=>
      location?.(i)        // check if external position management
      ?? pos[i]            // else: already loacally managed?
      ?? {x:100, y:100}    // elsee add default position
   ))
   const xy0 = useRef<KeyedPos>({key:-1, x:NaN,y:NaN})
   return <DragContext.Provider value={{starter:startDrag}}>
      <div className={`${className} ${styles.dragFrame}`} onMouseUp={stopDrag} onMouseMove={moveDrag} {...props}>
         {draggables.map((c,i) => {
            // get externally managed positions, or locally managed as fallback
            const p = location?.(i) ?? pos[i]
            return <div key={i} style={{left:p?.x, top:p?.y}} className={styles.draggable}>
               {c}
            </div>
         })}
      </div>
   </DragContext.Provider>

   function startDrag(i:number) {
      return (e:MouseEvent) =>  _startDrag(e, i)
   }

   function _startDrag(e:MouseEvent, i:number) {
      if (xy0.current.key<0) {
         e.preventDefault();
         e.stopPropagation();
         const p = location?.(i) ?? pos[i]
         xy0.current.x = p.x - e.clientX
         xy0.current.y = p.y - e.clientY
         xy0.current.key = i
      }
   }
   function moveDrag(e:MouseEvent) {
      if (xy0.current.key>=0) {
         e.preventDefault();
         e.stopPropagation();
         getXY(e.clientX, e.clientY, drag)
      }
   }
   function stopDrag(e:MouseEvent) {
      if (xy0.current.key>=0) {
         e.preventDefault();
         e.stopPropagation();
         getXY(e.clientX, e.clientY, 0)
         xy0.current.key = -1
      }
   }

   function getXY(x:number, y:number, drag:number) {
      const newX = x+xy0.current.x
      const newY = y+xy0.current.y
      const idealX = grid*(Math.round(newX/grid-0.5)+0.5)
      const idealY = grid*(Math.round(newY/grid-0.5)+0.5)
      x = idealX + (newX-idealX)*drag
      y = idealY + (newY-idealY)*drag
      location?.(xy0.current.key, x, y)
      const _pos = pos.slice()
      _pos[xy0.current.key] = {x, y}
      setPos(_pos)
   }
}