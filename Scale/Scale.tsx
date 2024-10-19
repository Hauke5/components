'use client'
import { MouseEvent, MutableRefObject, useEffect, useRef, useState, WheelEvent } 
                                 from 'react';
import { BaseProps }             from '@hauke5/components/BaseProps';
import styles                    from './Scale.module.scss'


export interface ScaleFn {
   /** translates mouse coordinates to logical coordinates */
   (ex:number, ey:number): {x:number, y:number}
}
export interface ScaleOptions {

}
export interface ScaleProps extends BaseProps {
   /** initial scale, defaults to 1 */
   scale?:      number
   /** initial shift, defaults to [0,0] */
   shift?:      [number,number]
   /** returns a function that translates mouse coordinates to logical coordinates */
   fromClient?: (fn:ScaleFn) => void
   shiftLogical?:(fn:ScaleFn) => void

}

const SCROLL_SCALER = 0.25

/**
 * scales and shifts the children content.
 * The component responds to `wheel` event:
 * - and scales the content when the `shift` button is pressed
 * - shifts (translates) the content when not
 */
export function Scale({scale, shift, fromClient, shiftLogical, style, className, children, ...rest}: ScaleProps) {
   const wheelTimeout = useRef<NodeJS.Timeout|null>(null)
   const canvasRef = useRef() as MutableRefObject<HTMLDivElement>
   const canvas = canvasRef.current
   const center = useRef({x0:0, y0:0, dx:0, dy:0})
   const [scaleFactor, setScaleFactor] = useState((scale??1-1)*10)
   const [shiftRatio, setShiftRatio] = useState(shift??[0,0])

   const scaling = 1+scaleFactor/1000
   const frameStyle = Object.assign({}, style, {
      backgroundColor:  '#fff',
      border:           'black',
   })
   const scaleStyle = {
      scale:      `${scaling}`,
      translate:  `${Math.round(shiftRatio[0])}px ${Math.round(shiftRatio[1])}px`,
   }
   useEffect(()=>{
      const x0 = (canvas?.clientWidth ?? 0)/2
      const y0 = (canvas?.clientHeight ?? 0)/2
      const dx = canvas?.offsetLeft
      const dy = canvas?.offsetTop
      // console.log(`scale center: ${x0}/${y0}, offset=${dx}/${dy}`, canvas.current)
      center.current = {x0,y0, dx, dy}
   },[canvas])
   useEffect(() => {
      const cancelWheel = (e:any) => wheelTimeout.current && e.preventDefault()
      document.body.addEventListener('wheel', cancelWheel, {passive:false})
      return () => document.body.removeEventListener('wheel', cancelWheel)
   }, [])
   fromClient?.((ex:number, ey:number) => {
      const d = center.current        //{x:div.offsetLeft, y:div.offsetTop}
      const x = (ex-d.dx-d.x0-shiftRatio[0])/scaling+d.x0
      const y = (ey-d.dy-d.y0-shiftRatio[1])/scaling+d.y0
      return {x, y}
   })
   shiftLogical?.((x:number, y:number)=> ({x:x+center.current.x0, y:y+center.current.y0}))
  
   // console.log(scaleStyle, shiftRatio)
   return <div style={frameStyle} className={`${styles.frame} ${className}`} onWheel={scroll} {...rest} onMouseOver={mouseOver}>
      <div ref={canvasRef} style={scaleStyle} className={styles.scaled}> {children} </div>
   </div>

   function scroll(e:WheelEvent<HTMLDivElement>) {
      e.stopPropagation()
      if (wheelTimeout.current) clearTimeout(wheelTimeout.current)
      wheelTimeout.current = setTimeout(() => wheelTimeout.current = null, 300)

      let newScale = scaleFactor
      let newShift:[number,number] = [shiftRatio[0], shiftRatio[1]]
      if (e.metaKey) {
         newScale -= e.deltaY
         setScaleFactor(newScale)
      } else {
         const s = scaling*SCROLL_SCALER+(1-SCROLL_SCALER)    // 1 --> 1
         newShift[0] -= e.deltaX*1/s
         newShift[1] -= e.deltaY*1/s
         setShiftRatio(newShift)
      }
      // console.log(`scale: ${scaling}, shift: ${fmt1(newShift[0])}/${fmt1(newShift[1])}`)
   }
   function mouseOver(e:MouseEvent) {
      // console.log(`scale: ${1+scaleFactor/1000}`, e)
   }
}


