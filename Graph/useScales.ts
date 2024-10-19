import { useEffect, useRef } 
                           from "react"
import { Log, MS2DAYS, formatDate } 
                           from "@hauke5/lib/utils"
import { CartesianScales, CartesianScalesConfig, CategoricalScale, ContinuousScale, DateScale, PolarScales, 
         PolarScalesConfig, Scale, ScaleCfg, ScaleRanges, ScalesConfig, 
         ScalesType,
         ScalesTypeCartesian,
         ScalesTypePolar} 
                           from "./types"
import { formatDecimal }   from "@hauke5/lib/utils/number"
import { useRerender } from "@hauke5/lib/hooks"

const log = Log('useScales')


export const IndexKey = '_INDEX'
const formatNumber = formatDecimal({minimumIntegerDigits:1, notation:'compact'})

export function useScales<DATA extends {}>(data:DATA[], scaleRanges:ScaleRanges, type:ScalesType, scalesConfig?:ScalesConfig) {
   const rerender = useRerender()
   const scales = useRef<{[key:string]:Scale}>({})
   useEffect(()=>{   
      log.debug(`clearing scales...`)
      scales.current = {}
      rerender()
   },[data, scaleRanges.bottom, scaleRanges.right, scalesConfig, rerender])
   const scaleSet = type===ScalesTypeCartesian
      ? cartesianScales(data, scaleRanges, scales.current, scalesConfig as CartesianScalesConfig)
      : polarScales(data, scaleRanges, scales.current, scalesConfig as PolarScalesConfig)

   return scaleSet
}


function cartesianScales<DATA extends {}>(data:DATA[], scaleRanges:ScaleRanges, scales:{[key:string]:Scale}, scalesConfig:CartesianScalesConfig):CartesianScales {
   type Dir = 'x'|'y'|'r'
   const dims:Dir[] = ['x', 'y', 'r']

   dims.forEach(dir => scalesConfig[dir] ??= {
      type:undefined, dataKeys:[], domain:undefined, range:undefined,
   })
   const config = {
      x: Object.assign({linear:true}, scalesConfig.x),
      y: Object.assign({linear:true}, scalesConfig.y),
      r: Object.assign({linear:true}, scalesConfig.r),
   }
   config.x!.range   ??= [scaleRanges.left, scaleRanges.right]
   config.x!.domain  ??= ['auto', 'auto']
   config.y!.range   ??= [scaleRanges.bottom, scaleRanges.top]
   config.y!.domain  ??= ['auto', 'auto']
   config.r!.range   ??= [3, 10]
   config.r!.domain  ??= [0, 'auto']
   const fns = {r: (v:number)=>Math.abs(v)}
   const cScales:CartesianScales = { 
      inverse,
      type:    ScalesTypeCartesian,
      ...Object.fromEntries(dims.map(dim => 
         [dim, ()=>scales[dim] ?? (scales[dim]=scale(dim, data, config[dim]!, fns[dim]))]
      )),
      viewport:   {orgX:0, orgY:0, width:100, height:100}
   } as CartesianScales
   return cScales

   function inverse(rangeX: number) {
      const xScale = cScales.x()
      const yScale = cScales.y()
      const rScale = cScales.r()
      const x = xScale.invert(rangeX)
      const xKeys = xScale.dataKeys
      const yKeys = yScale.dataKeys
      const rKeys = rScale.dataKeys
      const xKey = xKeys[0]

      // sort lowest-first by xKey
      const sortedData = data.toSorted((a,b) => a[xKey]<b[xKey]?-11:a[xKey]>b[xKey]?1:0)
      const index = sortedData.findIndex(d => d[xKey]>=x)
      const vals = {
         [xKey]: index<0? null : sortedData[index][xKey] ,
         ...Object.fromEntries(yKeys.map(key => [key, index<0? null : sortedData[index][key]])),
         ...Object.fromEntries(rKeys.map(key => [key, index<0? null : sortedData[index][key]])),
      }
      return vals
   }
}

function polarScales<DATA extends {}>(data:DATA[], scaleRanges:ScaleRanges, scales:{[key:string]:Scale}, scalesConfig:PolarScalesConfig):PolarScales {
   type Dir = 'phi'|'r'
   const dims:Dir[] = ['r', 'phi']

   dims.forEach(dir => scalesConfig[dir] ??= {
      type:undefined, dataKeys:[], domain:undefined, range:undefined,
   })
   const config = {
      phi:  Object.assign({linear:true}, scalesConfig.phi),
      r:    Object.assign({linear:true}, scalesConfig.r),
   }
   const dx = (scaleRanges.right-scaleRanges.left)/2
   const dy = (scaleRanges.bottom-scaleRanges.top)/2
   config.r.range    ??= [0, Math.min(dx, dy)]
   config.r.domain   ??= ['auto', 'auto']
   config.phi.range  ??= [0, 2*Math.PI]
   config.phi.domain ??= [0, 'auto']
   const cScales:PolarScales = { 
      inverse,
      type: ScalesTypePolar,
      ...Object.fromEntries(dims.map(dim => 
         [dim, ()=>scales[dim] ?? (scales[dim]=scale(dim,   data, config[dim]!))]
      )),
      viewport:   {orgX:0, orgY:0, width:100, height:100}
   } as PolarScales
   return cScales

   function inverse(rangeX: number, rangeY: number) {
      const x = rangeX+cScales.viewport.orgX
      const y = rangeY+cScales.viewport.orgY
      const r = Math.sqrt(x*x+y*y)
      let phi = Math.atan2(x, -y) //clockwise from +y axis
      if (phi<0) phi += 2*Math.PI
      const phiScale = cScales.phi()
      const rScale = cScales.r()
      const rDom = rScale.invert(r)
      const phiDom = phiScale.invert(phi)
      const phiKeys = phiScale.dataKeys
      const phiKey = phiKeys[0]
      const index = data.findIndex(d => d[phiKey]>=phiDom)
      const vals = +rDom<1 && +rDom>=+rScale.domain[0] && data.length>0
         ? Object.fromEntries(Object.keys(data[0]).map(key => [key,index<0? null : data[index][key]]))
         : {}
      return vals
   }
}

function scale<DATA extends {}, DIR extends string>(dir:DIR, data:DATA[], scaleCfg:Partial<ScaleCfg>, domainFn?:<T>(v:T)=>T):Scale {
   if (scaleCfg.dataKeys?.length) {
      const values = scaleCfg.dataKeys.reduce((acc, key) => acc.concat(data.map(d => d[key])), [] as DATA[]).filter(v => !!v)
      return getScale<DATA>(scaleCfg as Required<ScaleCfg>, values, domainFn)
   } else { // use index as key
      scaleCfg.type = 'number'
      return numericScale(scaleCfg as Required<ScaleCfg>, [0,data.length])
   }
}


function getAutoType(values:any[]):'string' | 'number' | 'boolean' | 'date' {
   const counts:{[type:string]:number} = values.reduce((acc, d)=> {
      if (d instanceof Date)           acc.date++
      else if (typeof d === 'number')  acc.number++
      else if (typeof d === 'string')  acc.string++
      else if (typeof d === 'boolean') acc.boolean++
      return acc
   }, {string:0, number:0, boolean:0, date:0})
   const type = Object.entries(counts).reduce((max,count)=> max[1]>=count[1]? max : count, ['number', 0])[0]
   return type as "string" | "number" | "boolean"
}

function getAutoDomain(scaleCfg:Partial<ScaleCfg>, values:any[], domainFn?:<T>(v:T)=>T) {
   let [min, max] = [0, 1]
   switch(scaleCfg.type) {
      case 'string':    return values.length===0? ['?'] : scaleCfg.domain?.includes('auto')? Array.from(new Set(values)) : scaleCfg.domain ?? []
      case 'boolean':   return [true, false]
      case 'number':    [min, max] = values.length===0? [0, 1] : values.reduce((acc,v:number)=>{
                           const val = domainFn? domainFn(v) : v
                           return [Math.min(acc[0], val), Math.max(acc[1], val)]
                        }, [1e99, -1e99])
                        break
      case 'date':      [min, max] =  values.length===0? [0, 1] : values.reduce((acc,v:Date)=>[Math.min(acc[0], v.getTime()), Math.max(acc[1], v.getTime())], [1e99, -1e99])
                        break
      default:          
   }
   if (min===max) max=min+1
   return scaleCfg.domain
      ? [scaleCfg.domain[0]==='auto'? min : scaleCfg.domain[0], scaleCfg.domain[1]==='auto'? max : scaleCfg.domain[1]]
      : [min, max]
}

function getScale<DATA extends {}>(scaleCfg:ScaleCfg, values:DATA[], domainFn?:<T>(v:T)=>T):Scale {
   scaleCfg.type   ??= getAutoType(values)
   const domain = getAutoDomain(scaleCfg, values, domainFn)
   switch(scaleCfg.type) {
      case 'string': return categoricalScale(scaleCfg, domain as string[])
      case 'number': return numericScale(scaleCfg, domain as [number, number])
      case 'date':   return dateScale(scaleCfg, domain as [number, number])
      default:       return numericScale(scaleCfg, domain as [number, number])
   }
}

//----- typed Scale functions


function numericScale(scaleCfg:ScaleCfg, domain:[number, number]):ContinuousScale {
   let [min, max] = domain
   if (min===max) max = min+1
   if (scaleCfg.linear === false && min>0) {
      min = Math.log(min)
      max = Math.log(max)
   }
   log.debug(`numeric: [${min},${max}]`)
   const scale:ContinuousScale = (domainValue:number) => scale.linear
      ? (domainValue - min)*(scaleCfg.range[1]-scaleCfg.range[0])/(max - min) + scaleCfg.range[0]
      : (Math.log(domainValue) - min)*(scaleCfg.range[1]-scaleCfg.range[0])/(max - min) + scaleCfg.range[0]
   scale.type     = 'number'
   scale.linear   = scaleCfg.linear
   scale.dataKeys = scaleCfg.dataKeys
   scale.domain   = [min, max]
   scale.range    = scaleCfg.range
   scale.ticks    = getNumericUnits(min, max).map(unit => ({
      rangeValue: scale(unit),
      label:      formatNumber(unit)
   }))
   scale.invert = (rangeVal:number) => scale.linear
      ? (rangeVal - scaleCfg.range[0])*(max - min)/(scaleCfg.range[1]-scaleCfg.range[0]) + min
      : Math.exp((rangeVal - scaleCfg.range[0])*(max - min)/(scaleCfg.range[1]-scaleCfg.range[0]) + min)
   return scale as ContinuousScale
}

function dateScale(scaleCfg:ScaleCfg, domain:[number, number]):DateScale {
   let [min, max] = domain
   if (min===max) max = min+1
   const scale:DateScale = (domainValue:number|Date) => {
      const val = typeof domainValue==='number'? domainValue : domainValue.getTime()
      return (val - min)*(scaleCfg.range[1]-scaleCfg.range[0])/(max - min) + scaleCfg.range[0]
   }
   scale.type     = 'date'
   scale.linear   = scaleCfg.linear
   scale.dataKeys = scaleCfg.dataKeys
   scale.domain   = [new Date(min), new Date(max)]
   scale.range    = scaleCfg.range
   scale.ticks    = getDateUnits(new Date(min), new Date(max)).map(unit => {
      const date = new Date(unit)
      return {
         rangeValue: scale(unit),
         label:      formatDate('%MM/%DD/%YY', date)  //`${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()%100}`
      }
   })
   scale.invert = (rangeVal:number) => new Date((rangeVal - scaleCfg.range[0])*(max - min)/(scaleCfg.range[1]-scaleCfg.range[0]) + min)
   return scale as DateScale
}

function categoricalScale(scaleCfg:ScaleCfg, domain:string[]):CategoricalScale {
   const scale:CategoricalScale = (domainValue:string) => {
      const index = domain.findIndex((v:string) => v===domainValue)
      return index*(scaleCfg.range[1]-scaleCfg.range[0])/domain.length + scaleCfg.range[0]
   }
   scale.type     = 'string'
   scale.linear   = true
   scale.dataKeys = scaleCfg.dataKeys
   scale.domain   = domain
   scale.range    = scaleCfg.range
   scale.ticks    = getCategoricalUnits(domain as string[]).map((unit:string) => ({
      rangeValue: scale(unit),
      label:      unit
   }))
   scale.invert = (rangeVal:number) => {
      const index = Math.round((rangeVal - scaleCfg.range[0]) * domain.length / (scaleCfg.range[1]-scaleCfg.range[0]))
      return domain[index]
   }
   return scale as CategoricalScale
}


//----- typed Unit functions
function getNumericUnits(min:number, max:number):number[] {
   const diff = Math.abs(max-min)
   const mag  = diff > 0 ? Math.pow(10, Math.floor(Math.log10(diff))) : 1
   const norm = diff/mag
   let step = 1
   if (norm<2) step = 0.5
   else if (norm<5) step = 1
   else step = 2

   step *= mag

   const result = [] as number[]
   let entry = Math.round(min/(step))*step
   let watcher = 0
   result.push(entry)
   while (entry<max) {
      entry = Math.round(entry + step)
      if (watcher++ > 20) break
      result.push(entry)
   }
   log.debug(`numericUnit: [${min}-${max}] -> [${result.join(', ')}], step=${step}, mag=${mag}`)
   return result
}

function getDateUnits(min:Date, max:Date):number[] {
   const daysDiff = MS2DAYS(max.getTime()-min.getTime())
   let step = {days:1, months:0, years:0}
   if (daysDiff<14) step = {days:1, months:0, years:0}
   else if (daysDiff<45) step = {days:7, months:0, years:0}
   else if (daysDiff<120) step = {days:0, months:1, years:0}
   else if (daysDiff<400) step = {days:0, months:3, years:0}
   else if (daysDiff<800) step = {days:0, months:6, years:0}
   else if (daysDiff<1500) step = {days:0, months:0, years:1}
   else if (daysDiff<4000) step = {days:0, months:0, years:2}
   else step = {days:0, months:0, years:5}

   const result:Date[] = []
   const entry = new Date(min)
   if (step.days>0) {
      entry.setHours(0, 0, 0, 0)
      // result.push(new Date(entry))
      let watcher = 0
      while (entry<max) {
         if (watcher++ > 20) break
         entry.setDate(entry.getDate()+step.days)
         result.push(new Date(entry))
      }
   } else if (step.months>0) {
      entry.setHours(0, 0, 0, 0)
      entry.setDate(1)
      entry.setMonth(Math.floor(entry.getMonth()/step.months)*step.months)
      // result.push(new Date(entry))
      let watcher = 0
      while (entry<max) {
         if (watcher++ > 20) break
         entry.setMonth(entry.getMonth()+step.months)
         result.push(new Date(entry))
      }
   } else /* step.years>0 */ {
      entry.setHours(0, 0, 0, 0)
      entry.setDate(1)
      entry.setMonth(0)
      entry.setFullYear(Math.floor(entry.getFullYear()/step.years)*step.years)
      // result.push(new Date(entry))
      let watcher = 0
      while (entry<max) {
         if (watcher++ > 20) break
         entry.setFullYear(entry.getFullYear()+step.years)
         result.push(new Date(entry))
      }
   }
   log.debug(`dateUnit: [${min.toDateString()}-${max.toDateString()}] -> [${result.map(d=>d.toDateString()).join(', ')}]`)
   return result.map(d => d.getTime())
}

function getCategoricalUnits(domain: string[]) {
   let step = Math.floor(domain.length/14)+1;
   const units = domain.filter((c,i) => i%step===0)
   return units
}