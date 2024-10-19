/**
 * ## Autohide
 * @module
 */

import { ReactNode } from 'react';
import styles        from './Autohide.module.scss'


interface AutohideProps {
   children:   ReactNode, 
   className?: string
}

/**
 * auto-hides the content unless it is hovered over.
 */
export function Autohide({children, className}:AutohideProps) {
   return <div className={`${styles.autohide} ${className ?? ''}`}>
      {children}
   </div>
}