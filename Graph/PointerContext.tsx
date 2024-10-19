import { MouseEvent, createContext, useContext, useEffect, useState }   
                           from "react";
import { BaseProps }       from "../BaseProps";
import { useGraphContext } from "./useGraphContext";
import { CartesianScales, PolarScales } from "./types";


const OUTSIDE = -10000

type Location = {
   range:   {x:number, y:number}, 
   values:  {[dim:string]:string|number}
   rangeVals: { [dim:string]:{[key:string]:number}}
}
export type PointerContext = Location

export const pointerContext = createContext<PointerContext|null>(null);


type PointerContextProps = BaseProps & {
   event: MouseEvent|null
}
export function CartesianPointerContext({event, children}:PointerContextProps) {
   const [location, setLocation] = useState<Location>({range:{x:OUTSIDE, y:OUTSIDE}, values:{}, rangeVals:{x:{}, y:{}}})
   const {scales} = useGraphContext<CartesianScales>()
   useEffect(()=> {
      const xScale = scales.x()
      const yScale = scales.y()
      const rScale = scales.r()
      const x = event?.nativeEvent.layerX ?? OUTSIDE
      const y = event?.nativeEvent.layerY ?? OUTSIDE
      const values = scales.inverse(x, y)
      const rangeVals = {
         x: Object.fromEntries(xScale.dataKeys.map(key => [key, values[key]===null ? OUTSIDE : xScale(values[key])])),
         y: Object.fromEntries(yScale.dataKeys.map(key => [key, values[key]===null ? OUTSIDE : yScale(values[key])])),
         r: Object.fromEntries(rScale.dataKeys.map(key => [key, values[key]===null ? OUTSIDE : rScale(values[key])])),
      }
      rangeVals.x._min = xScale.range[0]
      rangeVals.x._max = xScale.range[1]
      rangeVals.y._min = yScale.range[0]
      rangeVals.y._max = yScale.range[1]
      rangeVals.r._min = rScale.range[0]
      rangeVals.r._max = rScale.range[1]
      setLocation({range:{x, y}, values, rangeVals})
   }, [event?.nativeEvent.layerX, event?.nativeEvent.layerY, scales])
   return <pointerContext.Provider value={location}>
      {children}
   </pointerContext.Provider>
}

export function PolarPointerContext({event, children}:PointerContextProps) {
   const [location, setLocation] = useState<Location>({range:{x:OUTSIDE, y:OUTSIDE}, values:{}, rangeVals:{phi:{}, r:{}}})
   const {scales} = useGraphContext<PolarScales>()
   useEffect(()=> {
      const phiScale = scales.phi()
      const rScale   = scales.r()
         const x = event?.nativeEvent.layerX ?? OUTSIDE
      const y = event?.nativeEvent.layerY ?? OUTSIDE
      const values = scales.inverse(x, y)
      const rangeVals = {
         phi: Object.fromEntries(phiScale.dataKeys.map(key => [key, values[key]===null ? OUTSIDE : phiScale(values[key])])),
         r:   Object.fromEntries(rScale.dataKeys.map(key => [key, values[key]===null ? OUTSIDE : rScale(values[key])]))
      }
      rangeVals.phi._min = phiScale.range[0]
      rangeVals.phi._max = phiScale.range[1]
      rangeVals.r._min   = rScale.range[0]
      rangeVals.r._max   = rScale.range[1]
      setLocation({range:{x, y}, values, rangeVals})
}, [event?.nativeEvent.layerX, event?.nativeEvent.layerY, scales])
   return <pointerContext.Provider value={location}>
      {children}
   </pointerContext.Provider>
}


export function usePointerContext() {
   const context = useContext(pointerContext)
   if (!context) throw Error(`don't use 'usePointerContext' outside of scope`)
   return context
}