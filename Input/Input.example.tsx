'use client'
import { ChangeEvent, useState }  
                     from 'react';
import { formatDate }      from '@hauke5/lib/utils';
import styles        from './Input.example.module.scss'
import { Input }     from './Input';

const titleStyle = {flexBasis:'150px'}
const valueStyle = {flexBasis:'100px'}
const suggestions = ['one', 'two', 'three']

export function InputExample() {
   const [currNumber, setCurrNumber]   = useState(10)
   const [currText, setCurrText]       = useState('item')
   const [currDate, setCurrDate]       = useState(new Date())
   const [currSelect, setCurrSelect]   = useState<string>(suggestions[0])

   const numberUpdate = (e:ChangeEvent<HTMLInputElement>) => {
      setCurrNumber(+e.target.value)
      return e.target.value            // manage state component here
   }

   const textUpdate = (newValue:string) => {
      setCurrText(newValue)
   }

   const dateUpdate = (newValue:string) => {
      const date = new Date(newValue)
      if (!isNaN(date.getTime())) setCurrDate(date)       // manage state component here
   }
   const selectUpdate = (newValue:string) => {
      setCurrSelect(newValue)
   }
   return <div className={styles.example}>
      <h4>Select an item to edit:</h4>
      <div className={styles.row}>
         <span style={titleStyle}>{`Input Number:`}</span>
         <span style={valueStyle}>{currNumber}</span>
         <input type='number' onChange={numberUpdate} className={styles.field} placeholder="number"/>
      </div>
      <div className={styles.row}>
         <span style={titleStyle}>{`Input Text with suggestions:`}</span>
         <span style={valueStyle}>{currText}</span>
         <Input type='text' onChange={textUpdate} value={'...'} className={styles.field} list={suggestions}/>
      </div>
      <div className={styles.row}>
         <span style={titleStyle}>{`Input Text:`}</span>
         <span style={valueStyle}>{currText}</span>
         <Input type='text' onChange={textUpdate} value={'...'} className={styles.field} />
      </div>
      <div className={styles.row}>
         <span style={titleStyle}>{`Input Date:`}</span>
         <span style={valueStyle}>{formatDate('%MM/%DD/%YY', currDate)}</span>
         <Input type='date' onChange={dateUpdate} value={new Date()} className={styles.field}/>
      </div>
      <div className={styles.row}>
         <span style={titleStyle}>{`Select:`}</span>
         <span style={valueStyle}>{currSelect}</span>
         <Input type='select' onChange={selectUpdate} className={styles.field} value={currSelect} list={suggestions}/>
      </div>
   </div>
}