import { ReactNode, useState } 
                     from "react"
import { BaseProps } from '@hauke5/components/BaseProps'
import styles        from './ListSelect.module.scss'



export interface ListSelectProps extends Omit<BaseProps, 'onChange'> {
   children:   string[], 
   onChange:   (item:string)=>void, 
   header?:    ReactNode, 
   selected?:  string
}

/**
 * ## ListSelect
 * displays a list of items, one of which can be selected at a time. 
 * The component can manage its own state, or have it's state managed by the calling component.
 * ### Parameters:
 * - `children`: an array of strings to display as items of the list
 * - `selected`: optional item string that highlights the child item that it is equal to. 
 *    If mmissing, no child will be initially highlighted
 * - `header`: an optional header for the lists
 * - `onSelect`: a callback indicating a new selection. 
 * @param param0 
 * @returns 
 */
export function ListSelect({children, onChange: onSelect, selected, header, ...props}:ListSelectProps) {
   const [highlightItem, setHighlightItem] = useState(selected ?? '')
   const onClick = (i:number) => {
      setHighlightItem(children[i])
      onSelect(children[i])
   }
   const highlight = selected ?? highlightItem  // managed by parent before self-managed
   return <>
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.list} {...props}>
            {children && children.map((c,i) => <div className={highlight===c?styles.selected:''} onClick={()=>onClick(i)} key={i}>{c}</div>)}
      </div>
   </>
}