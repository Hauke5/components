'use client'
import styles     from './Tabs.module.scss'
import { ReactNode, useState }     
                  from 'react'

interface TabsProps {
   children:ReactNode[], 
   selectedIndex?:number|number[], 
   onSelect?:(index:number)=>void, 
   className?:string,
}

/**
 * ## Tabs
 * Creates a group of tabs 
 * @param props tabs properties
 * - selectedIndex: _optional_ if specified, programmatically sets the indexed tab as active
 * - onSelect: a callback function that will be called when the user presses a tab, along with the index of the tab pressed
 * - class: _optional_ a css class to apply
 * - children: the buttons to be grouped under this component
 */
export function Tabs(props: TabsProps) {
   const [selected, setSelected] = useState(props.selectedIndex ?? -1)
   if (selected !== props.selectedIndex && props.selectedIndex!==undefined) setSelected(props.selectedIndex)
   const className = props.className ?? ''
   
   const select = (i:number) => {
      setSelected(i)
      props.onSelect?.(i)
   }
   return <div className={`${styles.tabsGroup} ${className}`}>
      {props.children.map((c,i) => 
         <div className={`${styles.tabsItem} ${i===selected?styles.selected:''}`} key={i} onClick={e=>select(i)}>{c}</div>
      )}
   </div>
}