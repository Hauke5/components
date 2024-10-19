import { useRerender }     from '../../lib/hooks';
import { CSSProperties }   from 'react';
import { Table, useTableSort }           from './Table';
import styles              from './Table.module.scss'

export const cr = {padding:'2px 5px', textAlign: 'right'} as CSSProperties
export const cl = {padding:'2px 5px', textAlign: 'left'} as CSSProperties
export const cc = {padding:'2px 5px', textAlign: 'center'} as CSSProperties

const columns = [
   {header:'ID'},
   {header:'First name'},
   {header:'Last name'},
   {header:'Email'},
   {header:'Street'},
   {header:'Country'},
   {class:styles.center, header:'Pincode'},
   {header:'IBAN'},
]

const content = Array(100).fill(0).map((v,i) => [
   `${i+1}`.padStart(6,'0'), 'John', 'Doe', 'usermail@gmail.com', 'New York', 'United States', '21520', 'XYZ123'
])

export function TableExample() {
   const rerender = useRerender()
   return <Table widths={columns.map(c=>1)} className={styles.example}>
      <TableHeader />
      <TableContent />
   </Table>

}

function TableHeader() {
   return <>
      {columns.map((c,i) => <div key={i}>{c.header}</div>)}
   </>
}

function TableContent() {
   return <>
      {content.map((row,r) => <TableRow row={row} key={r}/>)}
   </>
}

function TableRow({row}:{row:string[]}) {
   return <>
      {row.map((c,i)=><div key={i}>{c}</div>)}
   </>
}
