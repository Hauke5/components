/**
 * ## DataBar
 * displays a horizontal bar that covers a fraction of available width with a background color.
 * @module
 */

import styles from './DataBar.module.scss'

export function DataBar(props: {fraction:number, children:React.ReactNode, className?:string}) { 
    return <div className={styles.fraction}>
        <div className={styles.share} style={{width:`${props.fraction*100}%`}}/>
        <div className={styles.border}/>
        <div className={`${styles.text} ${props.className??''}`}>{props.children}</div>
    </div>
}