import { useState }        from 'react';
import { formatDecimal }   from '@hauke5/lib/utils';
import { useLog }          from '../../lib/hooks';
import { Slider, StepSlider }    
                           from './Slider';
import styles              from './Slider.example.module.scss'

const range = [-10, 10]

const fmt0 = formatDecimal({minimumIntegerDigits:1, maximumFractionDigits:0})
const fmt1 = formatDecimal({minimumIntegerDigits:1, maximumFractionDigits:1})


export function SliderExample() {
   const log = useLog('SliderExample')
   const [sliderState, setSliderState] = useState(0)
   const [value, setValue] = useState(0.5)      // in range [0,1]
   const [rangeVal, setRangeVal] = useState(0)  // in range [-10, 10]
   return <div style={{width:'300px'}}>
      <div className={styles.label}>{`Simple Slider State: ${fmt1(sliderState)}%`}</div>
      <Slider value={sliderUpdate} className={styles.slider}/>
      
      <div className={styles.label}>{`Parent State: ${fmt0(value*100)}%`}</div>
      <Slider value={update} className={styles.slider} valClass={styles.valStyle}>
         {`Value: ${fmt1(value*100)}%`}
      </Slider>
      <StepSlider value={update} className={styles.stepSlider} valClass={styles.valStyle}>
         {`Value: ${fmt1(value*100)}%`}
      </StepSlider>
      
      <div className={styles.label}>{`Range: [-10, 10]: ${fmt1(rangeVal)}`}</div>
      <Slider value={update2} className={styles.slider} valClass={styles.valStyle}>
         <div>value</div>
         <div>{fmt1(rangeVal)}</div>
      </Slider>
   </div>

   function sliderUpdate(val?:number) {
      if (val!==undefined) {
         log.info(val)
         setSliderState(val)
      }
}

function update(val?:number) {
   if (val===undefined) return value
   setValue(val)
   return val
}

function update2(val?:number) {
   if (val===undefined) return (rangeVal - range[0]) / (range[1] - range[0])
   setRangeVal(val * (range[1] - range[0]) + range[0])
   return val
}
}
