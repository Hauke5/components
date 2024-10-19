import { useState }     from 'react';
import { Button }       from './Button';
import { RadioGroup }   from './RadioGroup';
import { Scale }        from '../Scale/Scale';
import { OnOffButton }  from './OnOffButton';


export function ButtonExample() {
   const [clicks, setClicks] = useState(0)
   const [toggle, setToggle] = useState(false)
   const [active, setActive] = useState([false, false, false])
   const [radio, setRadio]   = useState(0)
   const doClick = () => { console.log('pressed...'); setClicks(c=>c+1) }
   const doSelect = (index:number, active:boolean[]) => {
      console.log(`selected button ${index}`)
      setActive(active)
   }
   const radioSelect = (index:number) => {
      console.log(`selected button ${index}`)
      setRadio(index)
   }
   const onOff = (state:boolean) => {
      console.log(`on-off button ${state}`)
      setToggle(state)
   }
   const doToggle = () => setToggle(!toggle)
   
   const titleStyle = {fontWeight:'bold', marginTop:'10px'}
   const styles = {width: '300px', display:'flex', flexFlow:'column', gap:'10px', padding:'10px 30px'}
   return <Scale><div style={styles}>
      <div style={titleStyle}>Click Button:</div>
      <Button clicked={doClick}>{`clicked ${clicks} times`}</Button>
      <div style={titleStyle}>Button Group: {active.map((a,i)=>a?(i+1):null).filter(a=>a).join(', ')}</div>
      <RadioGroup onChange={doSelect} radio={false} selectedIndex={active}>
         <div>1</div>
         <div>2</div>
         <div>3</div>
      </RadioGroup>
      <div style={titleStyle}>Radio Buttons: {radio+1}</div>
      <RadioGroup onChange={radioSelect}>
         <div>1</div>
         <div>2</div>
         <div>3</div>
      </RadioGroup>
      <div style={titleStyle}>On/Off Button:</div>
      <OnOffButton onChange={onOff} initialState={toggle}>
         Horizontal
      </OnOffButton>
      <OnOffButton onChange={onOff} initialState={toggle} vertical={true}>
         Vertical
      </OnOffButton>
      <div style={titleStyle}>Remote-Controlled On/Off Button:</div>
      <Button clicked={doToggle}>{`toggle Power ${toggle?'off':'on'}`}</Button>
   </div>
   </Scale>
}