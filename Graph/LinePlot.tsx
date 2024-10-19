import { Fragment }        from "react";
import { useLog }          from "@hauke5/lib/hooks";
import { BaseProps }       from "../BaseProps";
import { useGraphContext } from "./useGraphContext";
import styles              from './Graph.module.scss'
import { CartesianScales } from "./types";


type LinePlotProps = BaseProps & {
   dataX?:        string
   dataY?:        string
   dataR?:        string
   type?:         'linear' | 'step'
   line?:         string | boolean
   area?:         string | boolean
   label?:        string | boolean
   marker?:       string | boolean
   text?:         (values:{[dim: string]: string | number})=>{[key:string]: string}
}
export function LinePlot({dataX, dataY, dataR, type='linear', line=false, area=false, marker=false, label=false, className='', text}:LinePlotProps) {
   const log            = useLog(`LinePlot`)
   const {data, scales} = useGraphContext<CartesianScales>()
   const scaleX = scales.x()
   const scaleY = scales.y()
   const scaleR = scales.r()

   if (data.length===0) return <></>
   
   if (!(dataX ??= scaleX.dataKeys[0])) log.warn(`no 'dataX' key defined on 'Scatter' or 'CartesianGrpah'`, scaleX.dataKeys);
   if (!(dataY ??= scaleY.dataKeys[0])) log.warn(`no 'dataY' key defined on 'Scatter' or 'CartesianGrpah'`, scaleY.dataKeys);
   dataR ??= scaleR.dataKeys[0]

   const points = data.map(d => [
      dataX? Math.round(scaleX(d[dataX])) : 0,  // 0: x
      dataY? Math.round(scaleY(d[dataY])) : 0,  // 1: y
      dataR? Math.round(scaleR(d[dataR])) : 0,  // 2: radius
      dataR? text? text(d)[dataR] : `${d[dataR]}` : ''                 // 3: label
   ])
   const loop = [
      [points.at(-1)![0], Math.round(scaleY(0))],
      [points[0][0], Math.round(scaleY(0))],
      [points[0][0], points[0][1]]
   ]

   const svgLine = 'M' + points.map(([x,y],i) => {
      switch (type) {
         case 'step': return `${x} ${i>0? points[i-1][1] : y} L${x} ${y} ` 
         case 'linear':
         default:     return `${x} ${y} `
      }
   }).join('L')
   const svgArea = `${svgLine}L${loop.map(([x,y])=>`${x} ${y}`).join(' L')} Z`
   const lineClass   = typeof line==='string'? line : styles.line
   const areaClass   = typeof area==='string'? area : styles.area
   const markerClass = typeof marker==='string'? marker : styles.marker
   const labelClass  = typeof label==='string'? label : styles.label
// log(`LinePlot render x=${dataX}, y=${dataY}, r=${dataR}: ${line?'line,':''} ${area?'area,':''} ${marker?'marker,':''} ${label?'label':''}`)
   return <g className={`${styles.series} ${className}`}>
      {line   && <g className={lineClass}><path d={svgLine}/></g>}
      {area   && <g className={areaClass}><path d={svgArea}/></g>}
      {marker && <g className={markerClass}>{points.map(([x,y,r],i) => <circle key={`c${i}`} cx={x} cy={y} r={Math.abs(+r)}/>)}</g>}
      {label  && <g className={labelClass}>{points.map(([x,y,r,label],i) => `${label}`.length>0? <text key={`t${i}`} x={x} y={y} dx='0' dy='-1.2em' textAnchor={'middle'}>{label}</text> : <Fragment key={`t${i}`}></Fragment>)}</g>}
   </g>
}