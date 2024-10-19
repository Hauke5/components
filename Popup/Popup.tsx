/**
 * ## Popup Widget
 * a component that shows a popup when triggered.
 * 
 * @module
 */

import { useRef, useEffect, ReactNode } 
                        from 'react';
import { createRoot }   from 'react-dom/client';
import { BaseProps }    from '@hauke5/components/BaseProps';
import styles           from './Popup.module.scss'
  

const OFF_SCREEN = -1000

interface XYPos {x:number, y:number}
export type Positioning = XYPos | 'hide' | 'proportional' | 'leftAligned' | 'rightAligned'
export interface PopupProps extends BaseProps {
    /** the content of the Popup */
    children:       ReactNode, 
    /** show or hide the popup */
    show:           boolean
    positioning?:   Positioning
    popupID?:       string
}
/**
 * ## Popup
 * a component that shows a popup when the mouse enters the component area. 
 * The Popup component will be created once, as a direct child of the `body` tag to ensure visibility beyond any 
 * parent's `overflow` setting. It is then shifted on- or off-screen via the `show` parameter.
 * 
 * Place `<Popup ...>` in the DOM component where you would like the Popup to appear. Multiple `<Popup>` components are supported.
 * This default location can be overruled by passing the following as a `show` parameter:
 * - `null`, `false`, or `"hide"`: hide the popup off-screen
 * - `[<xpos>,<ypos>]`: show the popup at the viewport coordinates `xpos` and `ypos`
 * - for the following values, show the popup at the location of the `<Popup>` component in the DOM:
 *     - `true` or `"proportional"`: adjust the alignment of the popup container proportional to its relative horizontal position in the viewport.
 *     - `"leftAligned"`: adjust the left edge of the popup container to be aligned with the left edge of `<Popup>`'s parent
 *     - `"rightAligned"`: adjust the right edge of the popup container to be aligned with the right edge of `<Popup>`'s parent
 * 
 * @param props component props:
 * - children: the content to show
 * - show: if true-ish, will show the popup, otherwise will hide it. If a number array is provided, it will determine the x- and y- position of the popup
 * - id: optional id for the popup; if omitted, an internal id will be created for each occurrence of `Popup`
 */
export function Popup({children, show, popupID='popupContainer', positioning, style, ...props}: PopupProps)  {
    const locationRef               = useRef<HTMLDivElement>(null)
    const id                        = useRef(popupID)

    useEffect(()=>{     // render popup content asynchronously:
        const xyPos = positioning as XYPos
        const coords = xyPos?.x
            ? xyPos
            : locationRef.current? getViewportCoordinates(locationRef.current) : {x:50, y:50}
            parentlessPopup({coords, children, popupID:id.current, show, ...props})
    },[show, children, positioning, props])

    return <div ref={locationRef} />    // an invisible div at the location where the popup will appear 
}

interface ParentlessPopupProps {
    /** the content of the Popup */
    children?:       ReactNode, 
    /** show or hide the popup */
    show:            boolean
    /** location to show the popup on the screen */
    coords:          {x:number, y:number, vpWidth?:number, popupWidth?:number}
    /** a unique popupID for this type of popup, to be reused by other calls to `parentlessPopup` */
    popupID?:        string,
}
/**
 * A parentless version on `<Popup...>`
 * - children:  the content of the Popup
 * - show:      show or hide the popup
 * - coords:    location to show the popup on the screen
 * - popupID:   a unique popupID (defaults to `popupContainer`) for this type of popup, to be reused by other calls to `parentlessPopup`
 */
export function parentlessPopup({popupID='popupContainer', children, show, coords,  ...props}:ParentlessPopupProps) {
    const root = createPopupRoot(popupID)
    const style = getPosStyle(coords, show? 'proportional' : 'hide')
    root.render(<PopupRender style={style} {...props}>{children}</PopupRender>)
}

function createPopupRoot(popupID:string) {
    const body = document.querySelector("body") ?? undefined
    if (!body) {
       console.error(`no 'body' parent found to bind Dialog to`)
       return
    }
    let container = document.getElementById(popupID)
    if (!container) {
        container = document.createElement("div")
        container.id = popupID
        container.classList.add(styles.container)
        // ensure that a click outside the container closes the popup:
        body.append(container);
        (body as any).root = (body as any).root ?? {};
        (body as any).root[popupID] = createRoot(container);
      //   console.info(`Popup created root for ${popupID} in {${Object.keys((body as any).root).join(', ')}}`)
    }
    return (body as any).root[popupID]
}



interface PopupRenderProps extends BaseProps {
   style:     PosStyle,
}
/** renders the popup at position `pos` */
function PopupRender({children, style, className, ...props}:PopupRenderProps) {
    return <div className={`${styles.popup} ${className??''}`} style={style} {...props}>
        {children}
    </div>
}    

function getViewportCoordinates(div:HTMLElement) {
    let x = div.clientLeft+div.clientWidth/2, 
        y = div.clientTop, 
        vpWidth = div.clientWidth,
        popupWidth = div.clientWidth
    while (div) {
        x += div.offsetLeft
        y += div.offsetTop
        vpWidth = Math.max(vpWidth, div.clientWidth)
        div = div.offsetParent as HTMLElement
    }
    return {x, y, vpWidth, popupWidth}
}
 
interface PosStyle {
    left:       string
    top:        string
    transform?: string
}
function getPosStyle(coords:{x:number, y:number, vpWidth?:number, popupWidth?:number}, positioning:Positioning='hide'):PosStyle {
    const xyPos = positioning as XYPos

    if (xyPos.x !==undefined && xyPos.y !==undefined) {
        return ({left:`${xyPos.x}px`, top:`${xyPos.y}px`})
    } else switch(positioning) {
        case 'proportional':
            return ({left:`${coords.x}px`, top:`${coords.y}px`, transform: `translate(-${coords.x*(coords.vpWidth?(1/coords.vpWidth):0)*100}%, 0%)`})
        case 'leftAligned':
            return ({left:`${coords.x-(coords.popupWidth??0)/2}px`, top:`${coords.y}px`, transform: `translate(0%, 0%)`})
        case 'rightAligned':
            return ({left:`${coords.x+(coords.popupWidth??0)/2}px`, top:`${coords.y}px`, transform: `translate(-100%, 0%)`})
        case 'hide':
        default:
            return ({left:`${OFF_SCREEN}px`, top:`${OFF_SCREEN}px`})
    }
}