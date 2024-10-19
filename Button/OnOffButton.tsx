
'use client'
import { ReactNode, useEffect, useState } 
                     from 'react'
import { BaseProps } from '@hauke5/components/BaseProps'
import styles        from './Button.module.scss'

export interface OnOffButtonProps extends Omit<BaseProps, 'onChange'>{
   onChange:      (newState:boolean)=>void
   children?:     ReactNode
   vertical?:     boolean
   initialState?: boolean
}

export function OnOffButton({onChange, children, vertical, initialState, className, ...props}:OnOffButtonProps) {
   const [on, setOn] = useState(initialState ?? false)
   useEffect(() => {
      if (typeof initialState === 'boolean') setOn(initialState)
   }, [initialState])
   const click = () => {
      setOn(on => !on)
      onChange(!on)
   }
   return <div className={`${styles.onOffButton} ${vertical?styles.vertical:styles.horizontal} ${className??''}`} {...props}>
      <div>{children}</div>
      <div className={`${styles.slot} ${on?styles.on:styles.off}`} onClick={click}>
         <div className={styles.slider}></div>
      </div>
   </div>
}