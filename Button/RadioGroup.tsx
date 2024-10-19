import styles           from './RadioGroup.module.scss'
import { ReactNode, useEffect, useState }     
                        from 'react'
import { BaseProps }    from '@hauke5/components/BaseProps'


export interface RadioGroupProps extends Omit<BaseProps, 'onChange'> {
   children:         ReactNode[]
   selectedIndex?:   number|boolean[], 
   radio?:           boolean, 
   onChange?:        (index:number, active:boolean[])=>void, 
   height?:          number
}
/**
 * ## ButtonRow
 * Creates a row of grouped buttons 
 * @param props button-group properties
 * @param props.radio _optional_ if present and truthy, configures the button row to only allow a single button to be pressed at a time
 * @param props.selectedIndex _optional_ if specified, programmatically sets the indexed button(s) as active.
 * If `selectedIndex` is of type `number`, the button child at that index is enabled. Use this format when 
 * `props.radio` is `true`.
 * If `selectedIndex` is of type `boolean[]`, its length needs to mmatch the number of children 
 * provided. The value at each index determine if the corresponding button child is selected or not.
 * @param props.onSelect a callback function that will be called when the user presses a button, along with the index of the button pressed
 * @param props.height _optional_ the height of the `ButtonRow`, in `px`; defaults to `30`
 * @param props.className _optional_ a css class to apply
 * @param props.children the buttons to be grouped under this component
 */
export function RadioGroup(props: RadioGroupProps) {
   const [selected, setSelected] = useState<boolean[]>(getSelectedArray(props.children.length, props.selectedIndex))
   useEffect(() => {
      setSelected(getSelectedArray(props.children.length, props.selectedIndex))
   }, [props.selectedIndex, props.children.length])

   const select = (index:number) => {
      if (props.radio===false) {
         const sels = selected.map((s,i) => index===i? !s : s)
         setSelected(sels)
         props.onChange?.(index, sels)
      } else {
         const sels = selected.map((s,i) => index===i? true : false)
         setSelected(sels)
         props.onChange?.(index, sels)
      }
   }
   const style:React.CSSProperties = {
      gridTemplateColumns: `repeat(${props.children.length}, auto)`,
      gridAutoRows: props.height ?? '30px'
   }
   return <div className={`${styles.group} ${props.className??''}`} style={style}>
      {props.children.map((c,i) => 
         <div className={`${styles.item} ${selected[i]?styles.selected:''}`} key={i} onClick={e=>select(i)}>{c}</div>
      )}
   </div>

   function getSelectedArray(length:number, selectedIndex?:number|boolean[]) {
      const index = selectedIndex ?? 0
      return Array(length).fill(false)
         .map((_,i) =>
            typeof index==='number'
            ? i===index? true : false
            : index[i]?  true : false
         )
   }
}