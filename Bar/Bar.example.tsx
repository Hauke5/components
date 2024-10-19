import { formatDecimal } from '@hauke5/lib/utils';
import { Bar } from './Bar';
import styles        from './Bar.example.module.scss'

const fmt0     = formatDecimal({minimumIntegerDigits:1, maximumFractionDigits:0})

const labelStyle = {
   paddingLeft:   '10px', 
   fontSize:      '80%', 
   color:         '#040',
}
const sliderStyle = {
   padding:       '5px 0',
   margin:        '10px 0', 
   width:         '300px', 
   border:        '1px solid #eee', 
}

export function BarExample() {
   const value = 0.5
   const val = fmt0(value*100)
   return <>
      <div style={labelStyle}>{`Value: ${val}%`}</div>
      <Bar value={value} style={sliderStyle}>{`simple val: ${val}%`}</Bar>
      <Bar value={value} style={sliderStyle} fgClass={styles.fgStyle} bgClass={styles.bgStyle} valClass={styles.valStyle}>
         <div>Structured value:</div>
         <div>{val}</div>
      </Bar>
   </>
}
