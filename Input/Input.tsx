import { ChangeEvent, FocusEvent, InputHTMLAttributes, KeyboardEvent, useId } 
                           from "react"


export type InputDataType  = number|string|boolean|Date
export type InputType = 'text'|'number'|'boolean'|'date'|'select'|'file'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "list"|"value"|"type"|"onChange"> {
   onChange:   (newValue:string) => void
   value?:     InputDataType
   type:       InputType
   list?:      string[]
   format?:    (val:string) => string
}
export function Input({value, onChange: update, type, step='any', list, className, format, id, ...props}:InputProps) {
   let inputID  = useId()
   if (id) inputID = id    // useId cant be called conditionally
   const listID   = useId()
   switch (type) {
      case 'number': 
         return <input id={inputID} type='text' inputMode='decimal' defaultValue={`${value}`} onFocus={selectAll} onBlur={blur} onKeyUp={decimalKeyUp} className={className} step={step} {...props} />
      case 'date':   
         const v = (value as Date).toISOString().substring(0,10)
         return <input id={inputID} type='date' defaultValue={v} onFocus={selectAll} onBlur={blur} className={className} {...props} />
      case 'text':   
         return <>
            <input id={inputID} type='text' defaultValue={`${value}`} key={`${value}`} onFocus={selectAll} onBlur={blur} onKeyUp={keyUp} className={className} list={listID} {...props} />
            <datalist id={listID}>{list?.map((item, i)=><option value={item} key={`${item}_${i}_${list.length}`}/>)}</datalist>
         </>
      case 'boolean':
         return <input id={inputID} type='checkbox' defaultChecked={value?true:false} onFocus={selectAll} onBlur={blur} onChange={handleCheck} className={className} {...props} />
      case 'select': 
         return <select id={inputID} defaultValue={`${value}`} onChange={handleSelect} className={className} title={props.title}>
            {list?.map(s => <option value={s} key={s}>{s}</option>)}
         </select>
      case 'file':   
         return <>
            <input id={inputID} type='file' key={`${value}`} onBlur={blur} className={className} {...props} />
         </>
      default:       
         return <div>{`unknown type '${type}'`}</div>
   }

   function decimalKeyUp(e:KeyboardEvent<HTMLInputElement>) {
      if (e.key ==='Enter') 
         (e.target as HTMLInputElement).blur()
      else {
         const newVal = ['0','1','2','3','4','5','6','7','8','9','0','-','+','.'].indexOf(e.key)<0
            ? (e.target as HTMLInputElement).value.replace(e.key,'')
            : (e.target as HTMLInputElement).value;
         (e.target as HTMLInputElement).value = format? format(newVal) : newVal
      }
   }

   function keyUp(e:KeyboardEvent<HTMLInputElement>) {
      if (e.key ==='Enter') 
         (e.target as HTMLInputElement).blur()
   }
   
   function selectAll() {
      const el = document.getElementById(inputID) as HTMLInputElement;
      el?.select();
   }
   function blur(e:FocusEvent<HTMLInputElement>) {
      update(e.target.value)
   }
   function handleCheck() {
      update(value?'off':'on')
   }
   function handleSelect(e:ChangeEvent<HTMLSelectElement>) {
      update(e.target.value)
   }
}
