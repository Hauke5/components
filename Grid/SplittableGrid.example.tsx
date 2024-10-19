import { ReactNode, useRef, useState }
                           from "react";
import { OnOffButton }     from '../Button/OnOffButton';
import { Card }            from "../Card";
import { useLog }          from '@hauke5/lib/hooks';
import { SplittableGrid }  from './SplittableGrid';


const exampleStyle = {
   margin: '10px',
   height: '100%',
   display: 'flex',
   flexFlow: 'column nowrap',
}

const buttoneStyle = {
   margin: '10px 0 10px 10px',
   display: 'flex',
   flexFlow: 'row nowrap',
   gap: '50px'
}

const gridStyle = {
   height:'100%',
}

export function SplittableGridExample() {
   const nodes = useRef<string[]>([])
   const log = useLog('Sandbox Splittable')
   const [left, setLeft] = useState(false)
   const [top, setTop]   = useState(true)

   return <div style={exampleStyle}>
      <div style={buttoneStyle}>
         <OnOffButton onChange={setLeft} initialState={left}>Left</OnOffButton>
         <OnOffButton onChange={setTop}  initialState={top}>Top</OnOffButton>
      </div>
      <SplittableGrid childAt={childAt} posTop={top} posLeft={left} style={gridStyle} />
   </div>

   function childAt(id:string, remove?:boolean):ReactNode {
      if (remove) {
         const index = nodes.current.findIndex(n => n===id)
         if (index>=0) {
            nodes.current.splice(index, 1)
            log.info(`removing leaf ${id}`, nodes.current)
         }
         return <></>
      } else {
         let verb = 'getting'
         let index = nodes.current.findIndex(n => n===id)
         if (index<0) {
            nodes.current.push(id)
            index = nodes.current.findIndex(n => n===id)
            verb = 'adding'
         }
         const newNumNodes = nodes.current.length
         log.info(`${verb} leaf ${id} at index ${index} of ${newNumNodes}`)
         return <Leaf id={id} index={index} num={newNumNodes}/>
      }    
   }
}

interface LeafProps {
   id:      string
   index:   number
   num:     number
}
function Leaf({id, index, num}:LeafProps) {
   return <Card>{`${id} , index ${index} of ${num}`}</Card>
}