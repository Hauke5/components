import { SyntheticEvent, useState }  
                           from 'react';
import { BaseProps }       from '@hauke5/components/BaseProps';
import styles              from './Select.module.scss'

export interface ValuerFn{ (newValue?:string):string|undefined }

export interface SelectProps extends BaseProps {
   valueFn: ValuerFn
   options: string[]
}

export function Select({className, valueFn, options, ...props}: SelectProps) {
   const [value, setValue] = useState<string|null>(null)
   const processValue  = (e:SyntheticEvent<HTMLInputElement|HTMLSelectElement>) => {
      setValue(e.currentTarget.value)
      valueFn(e.currentTarget.value)
   }
   const v = valueFn() ?? value ?? ''
   return <select value={v} className={`${styles.select} ${className}`} autoFocus onChange={processValue} {...props}>
      {options.map(o => <option value={o} key={o}>{o}</option>)}
   </select>
}