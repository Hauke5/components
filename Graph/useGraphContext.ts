import { useContext }   from "react"
import { GraphContext, graphContext } from "./GraphContext"
import { Scales }       from "./types"




export function useGraphContext<T extends Scales>() {
   const context = useContext(graphContext) as GraphContext<T>
   if (!context) throw Error(`don't use 'useGraphContext' outside of scope`)
   return context
   // return {scales:context.scales as T, data:context.data, viewport: context.viewport}
}