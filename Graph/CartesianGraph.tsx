import { MouseEvent, useEffect, useState }       
                                    from "react";
import { useResizer }               from "@hauke5/lib/hooks";
import { BaseProps }                from "../BaseProps";
import { GraphContext }             from "./GraphContext";
import styles                       from "./Graph.module.scss";
import { CartesianScalesConfig, Viewport } 
                                    from "./types";
import { CartesianPointerContext }  from "./PointerContext";



type CartesianGraphProps<DATA extends {}> = BaseProps & {
   data:          DATA[]
   margin?:       {top:number, bottom: number, left:number, right:number}
   scalesConfig?: CartesianScalesConfig
}

/**
 * Defines a cartesian graph.
 * @param param0 
 * @returns 
 */
export function CartesianGraph<DATA extends {}>({className, data, margin, children, scalesConfig}:CartesianGraphProps<DATA>) {
   const {domRef, viewport:vp}   = useResizer<SVGSVGElement>();
   const [viewport, setViewport] = useState<Viewport>({orgX: 0, orgY: 0, width:100, height:100 })
   const [event, setEvent]       = useState<MouseEvent|null>(null)
   useEffect(()=>{
      // console.log(`CartesianGraph useEffect`)
      const v = {orgX:0, orgY:0, width:vp.width, height:vp.height }
      setViewport(v)
   },[vp.height, vp.width])
      
   const viewBox = `${viewport.orgX} ${viewport.orgY} ${viewport.width} ${viewport.height}`
   const c = `${styles.graph} ${className??''}`

   return <GraphContext data={data} viewport={viewport} margin={margin} type='Cartesian' scalesConfig={scalesConfig}>
      <CartesianPointerContext event={event}>
         <svg ref={domRef} className={c} preserveAspectRatio="xMinYMin meet" viewBox={viewBox} width='100%' height='100%'
               onMouseMove={setEvent} onMouseLeave={()=>setEvent(null)}>
            {viewport.width>0 && children}
         </svg>
      </CartesianPointerContext>
   </GraphContext>
}

