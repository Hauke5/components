import { useEffect, useState } 
                                 from "react";
import { useContentChange }      from "./useChange";
import { useEditorContext } from "./useEditorContext";

const ACTIVE = true;

// const reportMS = 60000;

const timings: {[key:string]:{
   count:   number,
   sumMS:   number,
   maxMS:   number,
   minMS:   number,
}} = {};


export interface Entry {
   method:  string
   sumMS:   number
   count:   number
   avgMS:   number
   minMS:   number
   maxMS:   number
}

export type Timing = {
   // header:     {[Property in keyof Entry]:string},
   entries:    Entry[],
   maxTotal:   number,
   maxAvg:     number,
   maxCount:   number
}
/**
 * a hook to provide narrative timings in an array.
 * @param periodMS if provided, triggers an interval timer to provide the timings.
 * @returns an array of rows, one for each timing entry. Each row contains 
 * then name of the call, the total time spent in the call, the number of times it was called,
 * and the average time for the call. The first row contains the column headers.
 */
export function useTimings():Timing {
   const {currentView}  = useEditorContext()
   const change         = useContentChange(currentView)
   const [table, setTable] = useState<Timing>({
      entries:    [],
      maxTotal:   0,
      maxAvg:     0,
      maxCount:   0,
   })
   useEffect(()=>{
      const t:Timing = { 
         entries: [],
         maxTotal:0,
         maxAvg:  0,
         maxCount:0,
      }
      const entries = Object.entries(timings).sort((a,b) => (b?.[1].sumMS??0) - (a?.[1].sumMS??0))
      entries.forEach(e => {
         const avg = Math.round(e[1].sumMS/e[1].count*100)/100
         t.entries.push({method:e[0], sumMS:e[1].sumMS, count:e[1].count, avgMS:avg, minMS:e[1].minMS, maxMS:e[1].maxMS})
         t.maxTotal = Math.max(t.maxTotal, e[1].sumMS)
         t.maxAvg   = Math.max(t.maxAvg, e[1].maxMS)
         t.maxCount = Math.max(t.maxCount, e[1].count)
      })
      // t.entries
      //    .sort((e1, e2)=> e1[0]>e2[0]?1:-1)
         // .unshift(['method', 'total ms', '#', 'avg ms'])
      setTable(t)
   }, [change])
   return table;
}

export const headers = {method:'method', sumMS:'total ms', count:'#calls', avgMS:'avg ms', minMS:'min ms', maxMS:'max ms'}

const getKeyTiming = (key:string) => timings[key] ?? (timings[key]={count:0, sumMS:0, maxMS:0, minMS:0})


export function pluginTiming(key:string) {
   return {
      tmInit:  <T>(task:()=>T)=>timing<T>(`${key}_init`, task),
      tmApply: <T>(task:()=>T)=>timing<T>(`${key}_apply`, task),
      tmDecos: <T>(task:()=>T)=>timing<T>(`${key}_decos`, task),
      tmUpdate:<T>(task:()=>T)=>timing<T>(`${key}_update`, task),
   }
}

function timing<T>(key:string, task:()=>T):T {
   const start = Date.now()
   const result = task()
   if (ACTIVE) {
      const t = getKeyTiming(key)
      const dt = Date.now()-start
      if (t.count === 0) { t.maxMS = dt; t.minMS = dt }
      t.count++
      t.sumMS += Date.now()-start
      if (dt > t.maxMS) t.maxMS = dt
      if (dt < t.minMS) t.minMS = dt
   }
   return result
}
