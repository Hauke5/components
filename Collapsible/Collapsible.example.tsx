import { Collapsible }  from './Collapsible';
import styles           from './Collapsible.example.module.scss'


export function CollapsibleExample() {
   return <Collapsible>
      <div className={styles.header}>Header</div>
      <div className={styles.item}>line 1</div>
      <div className={styles.item}>line 2</div>
      <div className={styles.item}>line 3</div>
   </Collapsible>
}