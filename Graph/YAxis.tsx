import { BaseProps }       from "../BaseProps";
import { useGraphContext } from "./useGraphContext";
import styles              from './Graph.module.scss'
import { CartesianScales, ScaleRange, Tick }            
                           from "./types";


type YAxisProps = BaseProps & {
   log?: boolean
}
/**
 * defines the y-axis and its scale. If both `dataY` and `domain` are defined, `domain` takes precedence
 * @param param0.dataY optional field name in `data` to automatically derive the scale for the axis. 
 * @param param0.domain optional range of domain values that define the scale for the axis. 
 * @returns 
 */
export function YAxis({log}:YAxisProps) {
   const {scales} = useGraphContext<CartesianScales>()
   const scaleX = scales.x()
   const scaleY = scales.y()
   const ticks = scaleY.ticks
   const rangeX = scaleX.range
   const rangeY = scaleY.range

   return <g className={styles.yaxis}>
      <AxisLine rangeX={rangeX} rangeY={rangeY}/>
      <AxisTicks ticks={ticks.map(t => t.rangeValue)} length={5} rangeX={rangeX}/>
      <AxisLabels ticks={ticks} rangeX={rangeX}/>
   </g>
}

function AxisLine({rangeX, rangeY}:{rangeX:ScaleRange, rangeY:ScaleRange}) {
   const axisLine = `M${rangeX[0]??0} ${rangeY[1]??0} L${rangeX[0]??0} ${rangeY[0]??0}`
   return <path className={styles.line} d={axisLine}/>
}

type AxisTicksProps = {
   ticks:   number[]
   length:  number
   rangeX:  ScaleRange
}
function AxisTicks({ticks, length, rangeX}:AxisTicksProps) {
   const x = rangeX[0] ?? 0
   return <g className={styles.ticks}>
      {ticks.map((t,i) => <path d={`M${x} ${t} L${x-length} ${t}`} key={i}/>)}
   </g>
}

type AxisLabelsProps = {
   ticks:   Tick[]
   rangeX:  ScaleRange
}
function AxisLabels({ticks, rangeX}:AxisLabelsProps) {
   const x = rangeX[0] ?? 0
   return <g className={styles.labels}>
      {ticks.map((t,i) => {
         const y = isNaN(t.rangeValue)? 0 : t.rangeValue
         return <text y={y} x={x} dx="-5" dominantBaseline="middle" textAnchor="end" key={`${t.label}_${i}`}>
            {t.label}
         </text>
      })}
   </g>
}
