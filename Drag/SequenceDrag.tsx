import { MouseEvent, useEffect, useRef, useState } 
                     from 'react'
import styles        from './Drag.module.scss'
import { mdiClose }  from '@mdi/js'
import { Icon }      from '../Icon/Icon'
import { useLog }    from '../../lib/hooks/useLog'
import { Log } from '@hauke5/lib/utils'

const log = Log(`SequenceDrag`)

export interface SeqElement {
   iOrg:   number
   iDsp:   number
   width:  number
   left:   number
   active: boolean
   part:   string
}

export interface Dragging {
   i:      number
   dx:     number
}

const gap = 5

const sortLR = (a:SeqElement,b:SeqElement) => a.left - b.left


export function SequenceDrag({parts, className, drag=0.5, update}:{parts:string[], className:string, drag?:number, update:(newParts:string[])=>void}) {
   const [dragging, setDragging] = useState<Dragging|null>(null)
   const [desc, setDesc] = useState<SeqElement[]>(parts.map((p,i) => ({iOrg:i, iDsp:i, width:0, left:i, active:true, part:p})))
   const ref = useRef<HTMLDivElement>(null)
   const seq = useRef(desc.filter(d=>d.active)
                          .sort(sortLR).map(d=>d.part).join(' '))
   useEffect(()=>{
      log.info(()=>`useEffect initializing '`)
      setDesc(d => positionDesc(d.map((dd,i)=> {
         dd.width = ref.current?.children[i].getBoundingClientRect().width ?? 0; 
         return dd
      })))
   }, [])

   const i0 = dragging? dragging.i : -1
   return <div className={`${className??''} ${styles.seqDragFrame}`} onMouseUp={stop} onMouseMove={move} ref={ref}>
      {desc.map((d,i) => 
         <div style={{left:d.left??0}} onMouseDown={e=>start(e,i)} className={`${styles.sequenceDraggable} ${i===i0?styles.dragging:''} ${d.active?'':styles.inactive}`} key={d.iOrg}>
            <div className={styles.label}>{d.part}</div>
            <Icon className={styles.icon} mdi={d.active? mdiClose : ''} size={15} onClick={(e)=>deactivate(i,e)}/>
         </div>)}
   </div>

   function start(e:MouseEvent, i:number) {
      e.preventDefault();
      if (!desc[i].active) {
         setDesc(d=> {
            d[i].active = true
            return d.slice()
         })
      }
      setDragging({i:i, dx: desc[i].left - e.clientX})
   }
   function move(e:MouseEvent) {
      e.preventDefault();
      if (dragging) {
         setDesc(checkSwapDuringMove(e, dragging, drag, desc).slice())
      }
   }
   function stop(e:MouseEvent) {
      e.preventDefault();
      move(e)
      positionDesc(desc)
      notifyChange()
      setDragging(null)
   }
   function deactivate(index:number, e:MouseEvent) {
      desc[index].active = false
      setDesc(positionDesc(desc).slice())
      notifyChange()
   }

   function notifyChange() {
      const newSeq = desc.filter(d=>d.active).sort(sortLR).map(d=>d.part).join(' ')
      if (seq.current !== newSeq) {
         const active = desc.sort(sortLR).map((p) => (p.active?'':'!')+p.part)
         seq.current = newSeq
         update(active)
      }
   }
}


function checkSwapDuringMove(e:MouseEvent, dragging:Dragging, drag:number, desc:SeqElement[]):SeqElement[] {
   let newX = e.clientX + dragging.dx
   const c = closest(newX, desc)
   const cDsp = desc[c.iOrg].iDsp
   if (cDsp != desc[dragging.i].iDsp) { // swap iDsp position
      const match = desc.find(d=>d.iDsp===cDsp)
      if (match) {
         match.iDsp = desc[dragging.i].iDsp
         desc[dragging.i].iDsp = cDsp
         positionDesc(desc)
      }
   }
   desc[dragging.i] = Object.assign({}, desc[dragging.i], {iDsp:cDsp, left:c.left + (newX - c.left)*drag})
   return desc
}

function positionDesc(desc:SeqElement[]):SeqElement[] {
   let left = 0;
   // adjust left by actual widths:
   const setPos = (d:SeqElement) => {
      d.left = left
      left += d.width + gap
      return d
   }
   // sort on copy of array, in display order:
   desc.filter(d => d.active).sort(sortLR).map(setPos)
   left += 100

   // in original order:
   desc.filter(d => !(d.active)).sort((a,b) => a.iOrg - b.iOrg).map(setPos)
   return desc
}

function closest(x:number, desc:SeqElement[]):SeqElement {
   const active = positionDesc(desc)
      .map(d=>d)
      .filter(d=>d.active)
      .sort((a,b)=> Math.abs(a.left-x) - Math.abs(b.left-x))
   return active[0]
}
