import { useLog }          from "@hauke5/lib/hooks";
import { useGraphContext } from "./useGraphContext";
import styles              from './Graph.module.scss'
import { PolarScales, Scale }     from "./types";


type PiePlotProps = {
   dataPhi?:      string
   dataR?:        string
   type?:         'linear' | 'step'
   line?:         string | boolean
   area?:         string | boolean
   marker?:       string | boolean
   styleClasses?: string[]
   holeSize?:     number      // 0...1      
}
export function PiePlot({dataPhi, dataR, type='linear', holeSize=0.5, line=false, area=false, marker=true, styleClasses=['']}:PiePlotProps) {
   const log            = useLog(`Scatter`)
   const {data, scales} = useGraphContext<PolarScales>()
   const scalePhi = scales.phi()
   const scaleR   = scales.r()

   if (!(dataPhi ??= scalePhi.dataKeys[0])) log.warn(`no 'dataPhi' key defined on 'Scatter' or 'PolarScales'`);
   if (!(dataR   ??= scaleR.dataKeys[0])) log.warn(`no 'dataR' key defined on 'Scatter' or 'PolarScales'`);
   dataR ??= scaleR.dataKeys[0]

   const svgs = getSVGs(data, scalePhi, scaleR, dataPhi, dataR, holeSize)

   const lineClass = typeof line==='string'? line : styles.line
   const areaClass = typeof area==='string'? area : styles.area
   const markerClass = typeof marker==='string'? marker : styles.marker
   return <g className={styles.series}>
      {svgs.map((svg, i) => {
         const styleClass = styleClasses[i%styleClasses.length] || areaClass  // `${areaClass} ${styleClasses[i%styleClasses.length]}`
         return <path className={styleClass} key={i} d={svg} />
      })}
   </g>
}

function getSVGs(data:any[], scalePhi:Scale, scaleR:Scale, dataPhi:string, dataR:string, holeSize:number):string[] {
   const phiBase = 0    // base rotation: +y-axis
   const rd = Math.round
   let x0 = 0
   let y0 = 1
   let phi0 = 0
   return data.map((d,i) => {
      const R = rd(scaleR(d[dataR]))
      const R0 = R * holeSize
      const phi = scalePhi(d[dataPhi])
      const large = (phi-phi0)>Math.PI? 1 : 0
      phi0 = phi
      const x1 = Math.sin(phi)
      const y1 = Math.cos(phi)
      const svg = `M ${rd(R*x0)} ${-rd(R*y0)} ` +
         // clockwise arc to x1/y1
         `A${R} ${R} ${phiBase} ${large} 1 ${rd(R*x1)} ${-rd(R*y1)} ` +
         `L${rd(R0*x1)} ${-rd(R0*y1)} ` +
         // counterclockwise arc back to x0/y0
         `A${R0} ${R0} ${phiBase} ${large} 0 ${rd(R0*x0)} ${-rd(R0*y0)} ` +
         `Z`
      x0=x1
      y0=y1
      return svg
   })
}
