import { MouseEvent, useEffect, useState }       
                                 from "react";
import { useResizer }            from "@hauke5/lib/hooks";
import { BaseProps }             from "../BaseProps";
import { GraphContext }          from "./GraphContext";
import styles                    from "./Graph.module.scss";
import { PolarScalesConfig, Viewport }     
                                 from "./types";
import { PolarPointerContext }   from "./PointerContext";



type PolarGraphProps<DATA extends {}> = BaseProps & {
   data:          DATA[]
   margin?:       {top:number, bottom: number, left:number, right:number}
   scalesConfig?: PolarScalesConfig
}

/**
 * Defines a cartesian graph.
 * @param param0 
 * @returns 
 */
export function PolarGraph<DATA extends {}>({className, data, margin, children, scalesConfig}:PolarGraphProps<DATA>) {
   const {domRef, viewport:vp}   = useResizer<SVGSVGElement>();
   const [viewport, setViewport] = useState<Viewport>({orgX: 0, orgY: 0, width:0, height:0 })
   const [event, setEvent]       = useState<MouseEvent|null>(null)
   useEffect(()=>{
      const v = {orgX:-vp.width/2, orgY:-vp.height/2, width:vp.width, height:vp.height }
      setViewport(v)
   },[vp.height, vp.width])
      
   const viewBox = `${viewport.orgX} ${viewport.orgY} ${viewport.width} ${viewport.height}`
   const c = `${styles.graph} ${className??''}`

   return <GraphContext data={data} viewport={viewport} margin={margin} type='Polar' scalesConfig={scalesConfig}>
      <PolarPointerContext event={event}>
         <svg ref={domRef} className={c} preserveAspectRatio="xMinYMin meet" viewBox={viewBox} width='100%' height='100%'
               onMouseMove={setEvent} onMouseLeave={()=>setEvent(null)}>
            {viewport.width>0 && children}
         </svg>
      </PolarPointerContext>
   </GraphContext>
}

