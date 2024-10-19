import { JSXElementConstructor, MouseEvent, ReactElement, ReactFragment, ReactNode, ReactPortal, useState }       
                              from 'react';
import { Grid }               from '@hauke5/components/Grid/Grid';
import { BaseProps }          from '@hauke5/components/BaseProps';
import styles                 from './Table.module.scss'


type ReactType = ReactElement<any, string | JSXElementConstructor<any>> | ReactFragment | ReactPortal
export type TableData = string | number | Date | ReactType

export interface Cell {
   value:   TableData
   display: string | ReactNode   
   class?:  string
}

/**
 * determins column header and formatting details.
 */
export interface TableColumn {
   /** percentage width of the column for Grid template */
   width:   number
   /** the css class to use for  */
   class:   string

}

export interface TableProps extends BaseProps {
   /** list of widths; widths will be normalized to sum up to 100 */
   widths:           number[]
   sortCol?:         (col:number)=>void   
   children:         ReactNode
}

/**
 * ## Table
 * uses a `moveable` `Grid` to display a table.
 * 
 * ### Props
 * - widths: number array showing the relative width of each column; widhts will internally be normalized to fill the available parent width
 * - children: the table elements, provided as two or more `Fragments`. The first fragment of children constitute the table header that is clickable
 * - sort:  optional callback to initiate sorting; the callback will provide the index of the column header the user clicked on. 
 * If defined, this enables sorting by column, where `Table` assumes that the first child (`children[0]`) is a ReactFragment containing all column headers. 
 * `Table` will make columns headers clickable, and add a visual indication for the current sort column and direction. 
 * The actual sorting of the data is the responsibility of the calling component. See the `Built-in column sort` section below for an example
 * 
 * A typical call to `Table` then looks like this:
 * ```
 * ...
 * const columns = ['col1','col2','col3']
 * const rows = [
 *    ['row1Col1', 'row1Col2', 'row1Col3'],
 *    ['row2Col1', 'row2Col2', 'row2Col3'],
 *    ['row3Col1', 'row3Col2', 'row3Col3'],
 * ]
 * return <Table sort={sort}>
 *    <TableHeader columns={columns}/>
 *    <TableContent rows={rows}/>
 * </Table>
 * 
 * ...
 * 
 * function TableHeader({columns}):Fragment {
 *    return <>
 *       {columns.map(c => <div key={...}>{c}</div>)}
 *    </>
 * }
 * function TableContent({rows}):Fragment {
 *    return <>
 *       rows.map(row => {
 *         return row.map(c => <div key={...}>{c}</div>)
 *       })
 *    </>
 * }
 * ```
 * ### Built-in column sort
 * See [useTableSort] for an example of setting up sortable columns
 * 
 */
export function Table({widths, sortCol: sort, className, children, style:_style, ...props}:TableProps) { 
   const sum = widths.reduce((acc,w)=> acc+w, 0)
   const style = {
      columns: widths.map(col => `${col*100/sum}%`).join(' '),
   }
   return <Grid style={style} moveable={true} className={`${styles.table} ${className??''}`} {...props}>
      <div className={styles.header} onClick={onClick}>{children?.[0]}</div>
      {children?.[1]}
   </Grid>             
   
   function onClick(e:MouseEvent) {
      if (!sort) return 
      const target = e.target as HTMLElement
      const siblings = target.parentNode?.childNodes
      const index = siblings? Array.from(siblings).indexOf(target) : 0
      sort?.(index)
   }
}

/**
 * ## useTableSort
 * provides support functions for setting up a sortable table.
 * @param columnAccess 
 * @param initialSortCol 
 * @returns three functions that help the parent setup a sortable table:
 * - setSortCol: informs the hook which column should be sorted on. This information comes directly
 * from the <Table> component. 
 * - sortFn: the sort function to use to sort the rows of table data. 
 * - sortClass: a function provides a css class name to set on the header cells. 
 * It takes the cell's column and adds an arrow to the right of the cells content when the column is being sorted.
 * 
 * ### Example:
 * 
 * ```
 * type Entry = {
 *     name: string
 *     sum:  number
 * }
 * const const columnAccess = (col:number) => [
 *    (a:Entry)=>a.name,
 *    (a:Entry)=>a.sum, 
 * ][col]
 * 
 * function ParentComponent(...) {
 *    const {sortClass, sortFn, setSortCol} = useTableSort(columnAccess)
 *    return <Table  widths={columns} sortCol={setSortCol}>
 *       <Header />
 *       <Content />
 *    </Table
 * 
 *    function Header() {
 *       return <>
 *          <span className={`${sortClass(0)}`}>{headers.method}</span>
 *          <span className={`${sortClass(1)}`}>{headers.sumMS}</span>
 *       </>
 *    }
 *    function Content() {
 *       const data:Entry[] = [...]
 *       return data.sort(sortFn).map((entry:Entry, i)=> <Fragment key={`a${i}`}>
 *          <div>{entry.name}</div
 *          <div>{entry.sum}</div
 *       </Fragment>)
 *    }
 * }
 * ```
 */
export function useTableSort<TYPE=any>(columnAccess:(col:number)=>(a:TYPE)=>any, initialSortCol=0) {
   const [sortDef, setSortDef] = useState<{col:number, ascending:boolean}>({col:initialSortCol, ascending:true})

   const sortUpDown = <TYPE=any>(value:(a:TYPE)=>any) => ({
      up:   (row1:TYPE, row2:TYPE) => {
         const v1 = value(row1)
         const v2 = value(row2)
         return v2>v1? -1 : v2<v1? 1 : 0
      },
      down: (row1:TYPE, row2:TYPE) => {
         const v1 = value(row1)
         const v2 = value(row2)
         return v2<v1? -1 : v2>v1? 1 : 0
      }
   })   
   const upDown = sortUpDown(columnAccess(sortDef.col))
   const sortFn = sortDef.ascending? upDown.down : upDown.up;

   return {sortClass, sortFn, setSortCol}

   function sortClass(col:number, className='') {
      const sort = sortDef.col!==col? '' : (sortDef.ascending? styles.sortAscending : styles.sortDescending)
      return `${className} ${sort}`
   }

   function setSortCol(col:number) {
      setSortDef({col, ascending:sortDef.col===col? !sortDef.ascending : true})
   }
}