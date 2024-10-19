import { useState }     from 'react';
import { OnOffButton }  from '../Button/OnOffButton';
import { Card }         from '../Card';
import { Scrollable }   from '.';


export function ScrollableExample() {
   const [hasHeader, setHasHeader] = useState(true)
   const headerOnOff = (newState:boolean) => setHasHeader(newState)
   const style = {
      display: 'flex',
      flexFlow: 'nowrap column',
      // gridTemplateRows:'40px 1fr'
      overflow: 'hidden'
   }
   return <div style={style}>
      <OnOffButton onChange={headerOnOff} initialState={hasHeader}>Has Header:</OnOffButton>
      <Card><Scrollable hasHeader={hasHeader}>
         {Array(50).fill('Lore Ipsum...').map((c,i)=><div key={i}>{`row ${i+1}: ${c}`}</div>)}
      </Scrollable></Card>
   </div>
}