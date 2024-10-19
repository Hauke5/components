import { Scale } from './Scale';



export function ScaleExample() {
   const frameStyle = {
      width:            '300px',
      height:           '250px',
   }
   const contentStyle = {
      width:            '100%',
      height:           '100%',
      backgroundColor:  '#eee',
   }
   return <Scale scale={0.8} style={frameStyle}>
      <div style={contentStyle}>Scaling</div>
   </Scale>
   
}