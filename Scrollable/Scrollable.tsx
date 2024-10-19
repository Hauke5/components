/**
 * ## Scrollable
 * makles its content scrollable in vertical direction
 * 
 * ## Example
 * ```
 * function Example() {
 *    return <Card><Scrollable>
 *       {Array(25).fill('Lore Ipsum...').map((c,i)=><div key={i}>{`row ${i}: ${c}`}</div>)}
 *    </Scrollable></Card>
 * }
 * ```
 * ![Card example](/examples/Scrollable.png)
 * @module
 */

import { BaseProps }    from '@hauke5/components/BaseProps'
import styles           from './Scrollable.module.scss'


interface ScrollableProps extends Partial<BaseProps>{
   /** if `true`, will exclude first element from scrolling so that it remains readable */
   hasHeader?:  boolean
}

/**
 * ## Scrollable
 * renders children as a list that can be scrolled.
 * @param props component props:
 * - children: a list of `ReactNodes` to scroll over
 * - class: _optional_ css class on the encasing scrollable `div`
 */
export function Scrollable({className, children, hasHeader, ...props}: ScrollableProps) {
   return <div className={`${styles.scrollable} ${hasHeader?styles.header:''} ${className??''}`} {...props}>
      {children}
   </div>
}
