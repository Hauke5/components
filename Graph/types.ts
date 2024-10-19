export interface Viewport {
   orgX:   number;
   orgY:   number;
   width:  number;
   height: number;
}


export type ScaleCfg = {
   type?:      "string" | "number" | "boolean" | "date"
   linear:     boolean
   dataKeys:   string[]
   domain:     (number|string|Date|boolean)[]
   range:      ScaleRange
}

export type ScaleRange = [number, number]

export type CartesianScalesConfig = {
   x?:   Partial<ScaleCfg>
   y?:   Partial<ScaleCfg>
   r?:   Partial<ScaleCfg>
}
export type PolarScalesConfig = {
   r?:   Partial<ScaleCfg>
   phi?: Partial<ScaleCfg>
}

export type ScalesConfig = CartesianScalesConfig | PolarScalesConfig

export type ScaleRanges = {
   top:     number
   left:    number
   bottom:  number
   right:   number
}

export type ScaleType = 'lin' | 'log'

export type Tick = {
   rangeValue: number
   label:      string   
}

type BaseScale = {
   range:      [number, number]
   dataKeys:   string[]
   ticks:      Tick[]
   linear:     boolean
}
export type CategoricalScale = BaseScale & {
   type:    'string'
   domain:  string[]
   (domainValue:any): number
   invert:  (rangeVal:number) => string
}

export type ContinuousScale = BaseScale & {
   type:    'number'
   domain:  [number, number]
   (domainValue:any): number
   invert:  (rangeVal:number) => number
}

export type DateScale = BaseScale & {
   type:    'date'
   domain:  [Date, Date]
   (domainValue:any): number
   invert:  (rangeVal:number) => Date
}

export type ScalesType = 'Cartesian' | 'Polar'
export const ScalesTypeCartesian = 'Cartesian'
export const ScalesTypePolar     = 'Polar'

export type Scale = CategoricalScale | ContinuousScale | DateScale
export type BaseScales = {
   type:    ScalesType
   inverse: (rangeX:number, rangeY?:number)=>{[domainKey:string]:any}
   viewport:Viewport
}
export type CartesianScales = BaseScales & {
   x:       ()=>Scale, 
   y:       ()=>Scale, 
   r:       ()=>Scale, 
   type:    'Cartesian'
}
export type PolarScales = BaseScales & {
   r:       ()=>Scale, 
   phi:     ()=>Scale, 
   type:    'Polar'
}
export type Scales = CartesianScales | PolarScales
