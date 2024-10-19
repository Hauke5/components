import { useState } from 'react'
import { ListSelect } from './ListSelect'



const list = [
   'one',
   'two',
   'three',
]

export function ListSelectExample() {
   const [item, setItem] = useState('')
   const newListItem = (item:string) => setItem(item)
   return <div>
      <ListSelect onChange={newListItem} header={'Please select:'}>
         {list}
      </ListSelect>
      <div style={{marginTop: '10px'}}>{`current selection: ${item?item:'none'}`}</div>
   </div>
}