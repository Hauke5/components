import { BaseProps }       from "../BaseProps";
import { useGraphContext } from "./useGraphContext";
import styles              from './Graph.module.scss'
import { CartesianScales } from "./types";


type XGridProps = BaseProps & {
   ver?: boolean
   hor?: boolean
}
export function CartesianGrid({ver=false, hor=false}:XGridProps) {
   const {scales} = useGraphContext<CartesianScales>()
   const scaleX = scales.x()
   const scaleY = scales.y()
   return <>
      {hor && <g className={styles.horGrid}>
         {scaleY.ticks
            .map(t => [t.label, `M${scaleX.range[0]} ${t.rangeValue} L${scaleX.range[1]} ${t.rangeValue}`] as [string, string])
            .map((line, i) => <path className={styles.line} d={line[1]} key={`h_${line[0]}_${i}`}/>)}
      </g>}
      {ver && <g className={styles.verGrid}>
         {scaleX.ticks
            .map(t => [t.label, `M${t.rangeValue} ${scaleY.range[0]} L${t.rangeValue} ${scaleY.range[1]}`] as [string, string])
            .map((line, i) => <path className={styles.line} d={line[1]} key={`v_${line[0]}_${i}`}/>)}
      </g>}
   </>
}

