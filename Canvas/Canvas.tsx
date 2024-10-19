import { useEffect, MouseEvent } 
                        from "react";
import { useResizer }   from "@hauke5/lib/hooks"
import { BaseProps }    from "@hauke5/components/BaseProps";
import styles           from './Canvas.module.scss'

const AUTO_SIZE = 500

export interface CanvasInfo {
   context:  CanvasRenderingContext2D|null
   width:    number
   height:   number
}

export interface CanvasProps extends BaseProps {
   info:           (ci:CanvasInfo)=>void
   onClick?:       (e:MouseEvent)=>void
   onMouseOver?:   (e:MouseEvent)=>void
   width?:         number
   height?:        number
}

export function Canvas({info, onClick, onMouseOver, width, height, ...others}:CanvasProps) {
   const {domRef, viewport} = useResizer<HTMLCanvasElement>()
   useEffect(()=>{
      info({
         context: domRef.current?.getContext('2d') ?? null,
         width:   viewport.width,
         height:  viewport.height,
      })
   },[domRef, info, viewport.height, viewport.width])
   return <canvas onClick={onClick} onMouseOver={onMouseOver} ref={domRef} className={styles.canvas} height={height??AUTO_SIZE} width={width??AUTO_SIZE} {...others}/>
   //   return <canvas onClick={onClick} ref={domRef} className={styles.canvas} width={width} height={height} {...others}/>
}
