import { BaseProps }       from '../BaseProps'
import styles              from './Graph.module.scss'
import { useGraphContext } from './useGraphContext'


type TextPosition = {
   anchor?: "start" | "end" | "middle"
   xpos?:   number   // 0...1
   ypos?:   number   // 0...1
}

type TitleProps = BaseProps & {
   textPos?: TextPosition
}
export function Title({textPos, className, children}:TitleProps) {
   const {viewport} = useGraphContext()
   const anchor = textPos?.anchor ?? 'middle'
   const x0 = viewport.orgX
   const y0 = viewport.orgY
   const w = viewport.width
   const h = viewport.height
   const x = textPos?.xpos===undefined? `${x0+0.5*w}px` : `${textPos.xpos*w+x0}px`
   const y = textPos?.ypos===undefined? `${y0+0.1*h}px` : `${textPos.ypos*h+y0}px`
   // const x = textPos?.xpos===undefined? '50%' : `${textPos.xpos*100}%`
   // const y = textPos?.ypos===undefined? '10%' : `${textPos.ypos*100}%`
   return <g className={styles.title}>
      <text className={className??''} x={x} y={y} textAnchor={anchor}>{children}</text>
   </g>
}