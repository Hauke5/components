/**
 * ## Card
 * provides a foreground content with a backdrop shadow
 * 
 * ## Example
 * ```
 * function CompCard() {
 *    return <Card>
 *       {Array(5).fill('Lore Ipsum...').map((c,i)=><div key={i}>{c}</div>)}
 *    </Card>
 * }
 * ```
 * ![Card example](/examples/Card.png)
 * 
 * @module
 */

import { BaseProps } from '@hauke5/components/BaseProps'
import styles   from './Card.module.scss'



export interface CardProps extends BaseProps {
}

/**
 * ## CardComp
 * renders children inside a Card with a shadow border.
 * @param props children: list of `divs`
 */
export function Card({ children, className, ...others }: CardProps) {
    return <div className={`${styles.cardFrame}`} {...others}>
      <div className={`${styles.card} ${className??''}`}>
        {children}
      </div>
    </div>
}
