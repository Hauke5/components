import styles              from './Collapsible.module.scss'
import { useEffect, useRef, useState }        
                           from 'react'
import { BaseProps }       from '@hauke5/components/BaseProps'
import { useRerender }     from '@hauke5/lib/hooks/useRerender'


export interface CollapsibleProps extends BaseProps {
   /** indicate the initial state; defaults to `false` */
   isExpanded?:   boolean
   expand?:       (willExpand:boolean)=>void
   /** two or more `ReactNode` children. The first child will be used as collapsible header */
   children:      React.ReactNode[]
   isAnimated?:   boolean
}

/**
 * ## Collapsible
 * expects two or more children. The first will be wrapped as a clickable header that will expand or contract the additional children. 
 */
export function Collapsible({isExpanded, expand, isAnimated=true, className, children, ...props}: CollapsibleProps) {
   const contentRef  = useRef<HTMLDivElement>(null)
   const [expanded, setExpanded] = useState(isExpanded??false)
   const toggle = () => {
      console.log(`Collapsible toggle -> ${!expanded}`)
      setExpanded(!expanded)
      expand?.(!expanded)
   }
   const style = isAnimated
      ? {height:expanded?contentRef.current?.scrollHeight??0:0} 
      : {height:expanded?'auto':0}
   return <div className={`${styles.collapsible} ${className??''} ${expanded?styles.expanded : styles.collapsed}`} {...props}>
      <div className={styles.titleRow} onClick={toggle}>
         {children[0]}
      </div>
      <div className={styles.content} ref={contentRef} style={style}>{children.slice(1)}</div>
   </div>
}