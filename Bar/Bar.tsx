import { BaseProps }       from '@hauke5/components/BaseProps'
import { formatDecimal }   from '@hauke5/lib/utils'
import styles              from './Bar.module.scss'

export interface BarProps extends BaseProps {
   /** value between 0 and 1 */
   value:     number
   /** 
    * if `true`-ish, shows the slider value. Set this to a d3 format string to allow formatting.
    * Defaults to `,.1f`
    */
   showValue?: boolean | string
   /** styling of the slider foreground */
   fgClass?:   string
   /** styling of the slider background */
   bgClass?:   string
   /** styling of the value overlay */
   valClass?:   string
   /** styling of Bar container */
   className?: string
}

export interface BarMinMaxProps extends BarProps {
   min:        number
   max:        number
}

const DEF_VALUE_FMT = ',.1f'
const fmt2     = formatDecimal({minimumIntegerDigits:1, maximumFractionDigits:2})

/** 
 * A stateless component that plots a horizontal bar.
 * The component spans 100% of the parent container,
 * and the bar covers the fraction (0-1) `value` from the left.
 */ 
export function Bar({className, value, showValue=DEF_VALUE_FMT, children, 
                     fgClass=styles.fgStyle, bgClass=styles.bgStyle, valClass=styles.valStyle,
                     ...rest}:BarProps) {
   return <div className={`${styles.bar} ${className??''}`} {...rest}>
      {showValue && <div className={`${styles.valueDisplay} ${valClass}`}>
         {children}
         {!children && fmt2(value)}
      </div>}
      <div className={`${styles.foreground} ${fgClass}`} style={{width:`${value*100}%`}}/>
      <div className={`${styles.background} ${bgClass}`}/>
   </div>
}

export function BarMinMax({className, value, showValue=DEF_VALUE_FMT, children, 
   fgClass=styles.fgStyle, bgClass=styles.bgStyle, valClass=styles.valStyle,
   min, max,
   ...rest}:BarMinMaxProps) {
   return <div className={`${styles.bar} ${className??''}`} {...rest}>
      {showValue && <div className={`${styles.valueDisplay} ${valClass}`}>
         {children}
         {!children && `${fmt2(min)}-${fmt2(value)}-${fmt2(max)}`}
      </div>}
      <div className={`${styles.foreground} ${fgClass}`} style={{left:`${min*100}%`, width:`${(value-min)*100}%`}} />
      <div className={`${styles.background} ${bgClass}`}/>
   </div>
}

