import { Grid }   from './Grid'
import styles     from './Grid.module.scss'


export function GridExample() {
   return <Grid style={{columns:'20% 60% 20%'}} moveable className={styles.example}>
      <div className={styles.col}>{`column 1`}</div>
      <Grid style={{rows:"40% 30% 30%"}} moveable={true} className={styles.col}>
         <div className={styles.row}>{`row 1`}</div>
         <div className={styles.row}>{`row 2`}</div>
         <div className={styles.row}>{`row 3`}</div>
      </Grid>
      <div className={styles.col}>{`column 3`}</div>
   </Grid>
}

