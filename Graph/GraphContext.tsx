import { createContext, useEffect, useRef }   
                           from "react";
import { BaseProps }       from "../BaseProps";
import { useScales }       from "./useScales";
import { ScaleRanges, Scales, ScalesConfig, Viewport }       
                           from "./types";



export type GraphContext<T extends Scales = Scales> = {
   data:       any[]
   scales:     T
   viewport:   Viewport
}
export const graphContext = createContext<GraphContext|null>(null);


type GraphContextProps<DATA extends {}> = BaseProps & {
   data:          DATA[]
   viewport:      Viewport
   margin?:       {top:number, bottom: number, left:number, right:number}
   type?:         'Cartesian' | 'Polar'
   scalesConfig?: ScalesConfig
}
export function GraphContext<DATA extends {}>({children, data, viewport, margin, type='Cartesian', scalesConfig}:GraphContextProps<DATA>) {
   const scaleRanges = useRef<ScaleRanges>({top:0, left:0, bottom:0, right:0})
   const scales = useScales(data, scaleRanges.current, type, scalesConfig)
   useEffect(()=>{
      // console.log(`GraphContext useEffect`)
      scaleRanges.current = {
         top:     viewport.orgY+(margin?.top ?? 0),
         left:    viewport.orgX+(margin?.left ?? 0),
         bottom:  viewport.orgY+viewport.height-(margin?.bottom ?? 0),
         right:   viewport.orgX+viewport.width-(margin?.right ?? 0),
      }
   },[viewport.orgX, viewport.orgY, viewport.width, viewport.height, margin])

   scales.viewport = viewport

   return <graphContext.Provider value={{data, scales, viewport}}>
      {children}
   </graphContext.Provider>
}

