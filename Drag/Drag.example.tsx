import { SequenceDrag } from './SequenceDrag'
import { Grid }         from '../Grid/Grid'
import styles           from './Drag.example.module.scss'
import { DragFrame, useDragContext }    
                        from './DragFrame'
import { ReactChild, useState }   
                        from 'react'


export function DragExample() {
   const sequence = ['Div', 'Dept', 'SPF', 'Proj', 'Person']
   const [currSequence, setCurrSequence] = useState(sequence)
   const update = (orgSequence:string[]) => setCurrSequence(orgSequence)  //console.log(`[${sequence.join(',')}] -> [${orgSequence.join(',')}]`)
   const location = (index:number)=>null   // ({x:30+20*index, y:30+10*index})
   return <Grid className={styles.content} style={{columns:'50% 50%', rows:'50% 50%'}} moveable={true}>
      <DragFrame className={styles.frame1} location={location}>
         <Draggable index={0}>no grid</Draggable>
         <Draggable index={1}>.......</Draggable>
      </DragFrame>
      <DragFrame grid={100} stickyness={1} className={styles.frame2} location={location}>
         <Draggable index={0}>{'sticky grid'}</Draggable>
      </DragFrame>
      <DragFrame grid={100} stickyness={0.7} className={styles.frame3} location={location}>
         <Draggable index={0}>{'semi-sticky'}</Draggable>
      </DragFrame>
      <div>
         <SequenceDrag className={styles.seqDrag} parts={sequence} update={update}/>
         <div className={styles.result}>{currSequence.filter(c=>c.charAt(0)!=='!').join(' > ')}</div>
      </div>
   </Grid>
}

function Draggable({index, children, className=styles.draggable}:{index:number, className?:string, children:ReactChild}) {
   const {startEvent} = useDragContext(index)
   return <div onMouseDown={startEvent} className={className}>{children}</div>
}
