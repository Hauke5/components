import { Fragment }        from "react";
import { BaseProps }       from "../BaseProps";
import { useGraphContext } from "./useGraphContext";
import styles              from './Graph.module.scss'
import { ScaleRange, Tick, CartesianScales }
                           from "./types";


type XAxisProps = BaseProps & {
}
export function XAxis({}:XAxisProps) {
   const {scales} = useGraphContext<CartesianScales>()
   const scaleX = scales.x()
   const scaleY = scales.y()
   const ticks = scaleX.ticks
   const rangeX = scaleX.range
   const rangeY = scaleY.range
   return <g className={styles.xaxis}>
      <AxisLine rangeX={rangeX} rangeY={rangeY}/>
      <AxisTicks ticks={ticks.map(t => t.rangeValue)} length={5} rangeY={rangeY}/>
      <AxisLabels ticks={ticks} rangeY={rangeY}/>
   </g>
}

function AxisLine({rangeX, rangeY}:{rangeX:ScaleRange, rangeY:ScaleRange}) {
   const axisLine = `M${rangeX[0]??0} ${rangeY[0]??0} L${rangeX[1]??0} ${rangeY[0]??0}`
   return <path className={styles.line} d={axisLine}/>
}

type AxisTicksProps = {
   ticks:   number[]
   length:  number
   rangeY:  ScaleRange
}
function AxisTicks({ticks, length, rangeY}:AxisTicksProps) {
   const y = rangeY[0] ?? 0
   return <g className={styles.ticks}>
      {ticks.map((t,i) => <path d={`M${t} ${y} L${t} ${y+length}`} key={i}/>)}
   </g>
}

type AxisLabelsProps = {
   ticks:   Tick[]
   rangeY:  ScaleRange
}
function AxisLabels({ticks, rangeY}:AxisLabelsProps) {
   const y = rangeY[0] ?? 0
   return <g className={styles.labels}>
      {ticks.map((t,i, tArr) => i<ticks.length-1
         ? <text x={t.rangeValue} y={y} dy="15" textAnchor='start' key={`${t.label}_${i}`}>
            {t.label}
         </text>
         : <Fragment key={`${t.label}_${i}`}></Fragment>)}
   </g>
}