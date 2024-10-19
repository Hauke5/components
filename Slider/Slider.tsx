import { MouseEvent, useEffect, useRef, useState } 
                           from 'react';
import { mdiChevronDoubleLeft, mdiChevronDoubleRight, mdiChevronLeft, mdiChevronRight } 
                           from '@mdi/js';
import { BaseProps }       from '@hauke5/components/BaseProps';
import { Icon }            from '@hauke5/components/Icon';
import { Bar }             from '@hauke5/components/Bar/Bar';
import styles              from './Slider.module.scss'




export interface SliderProps extends BaseProps {
   /**
    * used to provide slider updates to the parent component. 
    * Per default, the `Slider` component controls the slider value as its own state.
    * The parent component can override the default control by providing back a value as a result of this call.
    */
   value:      ((newValue?:number)=>number|void)
   range?:     [number, number]
   /** if `true`-ish, shows the slider value. Set this to a d3 format string to allow formatting  */
   showValue?: boolean | string
   /** styling of the slider foreground */
   fgClass?:   string
   /** styling of the slider background */
   bgClass?:   string
   /** styling of the value overlay */
   valClass?:   string
   /** styling of Bar container */
}


const DEFAULT_SLIDER_VALUE = 0.5


/**
 * creates a simple slider:
 * - responsive to clicking and dragging in the slider area
 * - keeps a state on the value of the slider in case the parent doesn't
 * - informs the parent of state changes by calling the `value` function
 */
export function Slider({value, ...rest}:SliderProps) {
   const parentValue = value() as number
   const [slider, setSlider] = useState<number>(parentValue ?? DEFAULT_SLIDER_VALUE)
   useEffect(()=>{ 
      // overrule local state with parent value
      if (parentValue!==undefined) setSlider(parentValue as number)
                              else value(DEFAULT_SLIDER_VALUE)
   },[parentValue, value])
   const drag = useRef<number|null>(null)
   return <Bar value={slider} onMouseDown={dragStart} onMouseMove={dragMove} onMouseUp={dragEnd} onMouseLeave={dragLeave} {...rest}/>

   function dragStart(e:MouseEvent) { 
      const w = (e.target as HTMLDivElement).clientWidth
      const x = (e.nativeEvent as any).layerX as number
      drag.current = x/w
      value(drag.current)
      setSlider(drag.current)
   }
   function dragMove(e:MouseEvent<HTMLElement>)  { 
      if (drag.current) dragStart(e)
   }
   function dragLeave(e:MouseEvent<HTMLElement>)  { 
      if (drag.current) {
         setSlider(drag.current)
         drag.current = null
      }
   }
   function dragEnd(e:MouseEvent<HTMLElement>)   { 
      dragMove(e)
      drag.current = null
   }
}


const MAJOR_INC = 0.1
const MINOR_INC = 0.01

/**
 * A `Slider` that has step buttons around the slider field
 */
export function StepSlider({value, className, ...rest}:SliderProps) {
   const parentValue = value() as number
   const [slider, setSlider] = useState<number>(parentValue ?? DEFAULT_SLIDER_VALUE)
   useEffect(()=>{ if (parentValue!==undefined) setSlider(parentValue as number)},[parentValue])

   return <div className={styles.stepSlider}>
      <Icon mdi={mdiChevronDoubleLeft} className={styles.icon} onClick={()=>inc(-MAJOR_INC)} />
      <Icon mdi={mdiChevronLeft} className={styles.icon} onClick={()=>inc(-MINOR_INC)} />
      <Slider value={update} className={className??''} {...rest}/>
      <Icon mdi={mdiChevronRight} className={styles.icon} onClick={()=>inc(MINOR_INC)} />
      <Icon mdi={mdiChevronDoubleRight} className={styles.icon} onClick={()=>inc(MAJOR_INC)} />
   </div>

   function update(newValue?:number):number {
      if (newValue===undefined) return slider
      // prioritize parent control, back up by own state control:
      newValue = value(newValue) as number ?? newValue
      setSlider(newValue)   
      return newValue
   }

   function inc(step:number) { update(Math.max(0, Math.min(slider+step, 1)))}
}


