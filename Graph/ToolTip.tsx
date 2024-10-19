
import { formatDate }         from '@hauke5/lib/utils'
import { formatDecimal }      from '@hauke5/lib/utils/number'
import { BaseProps }          from '../BaseProps'
import styles                 from './Graph.module.scss'
import { usePointerContext }  from './PointerContext'
import { useGraphContext } from './useGraphContext'
import { CartesianScales } from './types'


export type ToolTipProps = {
   label?:  string
   value?:  string
   text?:   (values:{[dim: string]: string | number})=>{[key:string]: string}
   keys?:   string[]
}
export function ToolTip({label, value='value', text, keys}:ToolTipProps) {
   const {scales} = useGraphContext()
   return scales['x']
      ? <CartesianTooltip label={label} text={text} keys={keys}/>
      : <PolarTooltip label={label} value={value} text={text}/>
}

function CartesianTooltip({label, text, keys}:ToolTipProps) {
   const {scales} = useGraphContext<CartesianScales>()
   const {values, rangeVals} = usePointerContext()
   const valueTexts = text? text(values) : null
   const xScale = scales.x()
   const yScale = scales.y()
   const rScale = scales.r()
   const xKeys = Object.values(xScale.dataKeys)
   const yKeys = keys ?? Object.values(yScale.dataKeys).filter(k => k.indexOf('_')!==0)
   const rKeys = Object.values(rScale.dataKeys)
   const cx = rangeVals.x[xKeys[0]]
   const xValue = values[xKeys[0]]
   const showXval = valueTexts?.[xKeys[0]] ??format(xValue)
   const y1 = rangeVals.y._min
   if (isNaN(y1)) return <g className={styles.tooltip} />

   return <g className={styles.tooltip} >
      <line x1={cx} x2={cx} y1={rangeVals.y._min} y2={rangeVals.y._max} className={styles.line}/>
      <Text className={styles.label} x={cx} y={rangeVals.y._min} dx='0' dy='1.3em' textAnchor={'middle'}>{showXval}</Text>
      {yKeys.map(key => {  // series value labels
         const val = valueTexts?.[key] ?? `${key}: ${format(values[label ?? key])}`
         const cy = rangeVals.y[key]
         if (isNaN(cy)) return <g key={key} />

         return <g key={key} >
            <circle className={styles.circle} cx={cx} cy={cy} r='5'/>
            <Text className={styles.label} x={cx} y={cy} dx='-10px' dy='0.35em' textAnchor={'end'}>{val}</Text>
         </g>
      })}
      {rKeys.map(key => {  // series marker Labels
         const val = valueTexts?.[key] ?? `${key}: ${format(values[label ?? key])}`
         return <g key={key} >
            <Text className={styles.label} x={cx} y={rangeVals.y[yKeys[0]]} dx='-10px' dy='-1.2em' textAnchor={'end'}>{val}</Text>
         </g>
      })}
   </g>
}

function PolarTooltip({label, value='value', text}:ToolTipProps) {
   const {viewport}                 = useGraphContext()
   const {range, values, rangeVals} = usePointerContext()
   const valueTexts = text? text(values) : null
   const phiKeys = Object.keys(rangeVals.phi)
   const rKeys = Object.keys(rangeVals.r).filter(k => k.indexOf('_')!==0)
   const cx = viewport.orgX + range.x
   const cy = viewport.orgY + range.y
   const val = valueTexts? valueTexts[Object.keys(valueTexts)[0]] : values[label ?? rKeys[0]]
      ? `${values[label ?? rKeys[0]]}: ${format(values[value ?? phiKeys[0]])}` 
      : ''
   return <g className={styles.tooltip} >
      <circle className={styles.circle} cx={cx} cy={cy} r='5'/>
      <Text className={styles.label} x={cx} y={cy} dx='0' dy='-1em' textAnchor={'middle'}>{val}</Text>
   </g>
}

const formatNumber = formatDecimal({minimumIntegerDigits:1, maximumFractionDigits:0})
function format(val:string|Date|number):string {
   return typeof val==='number' 
      ? formatNumber(val)
      : val instanceof Date
         ? formatDate('%MM/%DD/%YY', val)
         : val
}

type TextProps = BaseProps & {
   x:          number
   y:          number
   dx:         string      // allow 'em' or 'px'
   dy:         string      // allow 'em' or 'px'
   textAnchor: 'start'|'middle'|'end'
}
function Text({x, y, dx, dy, textAnchor: anchor, className='', children}:TextProps) {
   return (isNaN(x) || isNaN(y))
   ? <g className={className}></g> 
   : <g className={className}>
      <text x={x} y={y} dx={dx} dy={dy} textAnchor={anchor}>{children}</text>
      <text x={x} y={y} dx={dx} dy={dy} textAnchor={anchor}>{children}</text>
   </g>
}