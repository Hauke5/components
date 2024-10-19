'use client'
import { useEffect, useRef, useState } from 'react';
import { BaseProps }       from '@hauke5/components/BaseProps';
import styles              from './Collapsible2.module.scss'


export interface CollapsibleProps extends BaseProps {
   /** initially show as expanded; defaults to `false */
   isExpanded?:   boolean
   /** notifies parent that the widget is expanding or collapsing due to a user click */
   expanding?:    (willExpand:boolean)=>void
   children:      React.ReactNode[]
}
/**
 * allows the `children` to be collapsed to show only the fist child 
 */
export function Collapsible({children, isExpanded, expanding, className, onClick, ...props}:CollapsibleProps) {
   const [expanded, setExpanded] = useState(false)
   useEffect(()=>{
      if (isExpanded) setExpanded(true)
   },[isExpanded])
   
   const toggle = () => {
      setExpanded(e => !e)
      expanding?.(!expanded)
   }
   let style = {height:`${expanded?'auto':'0px'}`}
   return <div className={`${styles.collapsible} ${className??''}`} {...props}>
      <div className={styles.titleRow} onClick={onClick}>
         <span className={`${styles.expander} ${expanded?styles.expanded : styles.collapsed}`} onClick={toggle}/>
         {children[0]}
      </div>
      {children.slice(1).map((child, i) => <div className={styles.content} style={style} key={i}>{child}</div>)}
   </div>
}