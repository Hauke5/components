'use client'
import { MouseEvent, useEffect, useRef, useState, useTransition }    
                                 from "react"
import { Rerender, useRerender } from "lib/hooks/useRerender"
import { BaseProps }             from "components/BaseProps"
import { Input, InputDataType }  from "components/Input/Input"
import { ErrorBoundary }         from "lib/errors"
import { DlgConfig, DialogButtonConfig,  DlgReturn, DialogDesc, DialogItemResult, ItemsLiteral }   
                                 from './DialogTypes'
import styles                    from './Dialog.module.scss'

const OFF_SCREEN = -10000

export const cancelButton = 'Cancel'

export function addDialogItemHandler(handle:string, handler:DialogItemHandler) {
   dialogItemHandlers[handle] = handler
}

const dialogItemHandlers:DialogItemHandlers = {
   'none':  dialogItemNoneHandler,
   default: dialogItemDefaultHandler
}

type DialogProps<BUTTON_NAMES, ITEM_NAMES> = BaseProps & {
   open: <B = BUTTON_NAMES, I = ITEM_NAMES>(openDialog:(dialogConfig:DlgConfig<B, I>)=>Promise<DlgReturn<B, I>>)=>void
   x0?:  number
   y0?:  number
}

/**
 * ## Dialog
 * Provides a standardiazed dialog box.
 * `open` provides a hook for the calling function that
 * - allows it to open the dialog box by calling the hook with the content to show
 * - provides the interaction result as an asynchronous response, including the action taken and the values of all fields by name.
 *
 * ### Receiving results from the dialog
 * 1. via the open hook (preferred method):
 * Dialog results are provided as an asynchronous response the hook call
 * 2. via the `DialogAction` functions defined for each dialog button
 * 
 * 
 * Example for using `open` in the calling function:
 * ```
 * function CallingComponent() {
 *    const openDialog  = useRef<OpenDialog>()
 *    ...
 *    return <div>
 *       ...
 *       <Dialog open={open=>openDialog.current=open}/>
 *    </div> 
 * 
 *    async function callDialog() {
 *       if (openDialog.current) {
 *          const result = await openDialog.current?.(content)
 *          if (result.actionName === updateButton) {
 *             const action = result.actionName
 *             const volume = result.values[volumeKey].value as number
 *             ...
 *          }
 *       }
 *    }
 * }
 * 
 * const volumeKey    = 'Volume'
 * const updateButton = 'Update'
 * const content = {
 *    title: `Example Dialog:`,
 *    items:[
 *       {[volumeKey]: { type:'number', initial,  label: 'Volume:' }},
 *    ],
 *    buttons:[
 *       {[updateButton]: {}}
 *    ]
 * }
 * ```
 * ### Parameters
 * - `open` the hook to call to open the dialog
 * - `x0` the initial x position in position in pixels
 * - `y0` the initial y position in position in pixels
 */
export function Dialog<BUTTON_NAMES, ITEM_NAMES>({open, x0=100, y0=100}:DialogProps<BUTTON_NAMES, ITEM_NAMES>) {
   const ref                  = useRef<HTMLDialogElement>(null)
   const rerender             = useRerender()
   const [config, setConfig]  = useState<DialogDesc<BUTTON_NAMES, ITEM_NAMES>>()
   const [pos, setPos]        = useState({x:x0, y:y0, _x:-10000, _y:-10000})
   const act                  = useRef<(actionName:keyof BUTTON_NAMES)=>void>((actionName:keyof BUTTON_NAMES)=>undefined)

   // run once to provide opening hook to caller
   useEffect(()=>{ 
      /**
       * Opens a modal dialog with the provided content 
       * and sets up a response resolution
       * @param content 
       * @returns 
       */
      open(async function openWithContent(dialogConfig:DlgConfig<BUTTON_NAMES, ITEM_NAMES>):Promise<DlgReturn<BUTTON_NAMES, ITEM_NAMES>> {
         ref.current?.showModal()
         // initialize dialog with defaults, keep other values from prior dialog call
         const dialogItems:DialogItemResult<ITEM_NAMES>[] = (dialogConfig.items??[]).map(item => {
            return {
               id:       item.id,
               type:       item.type,
               label:      item.label ?? item.id,
               isDefault:  true,
               initial:    item.initial as typeof item.type,
               value:      item.initial as typeof item.type,
               disable:    item.disable ?? (()=>false),
               sideEffect: item.sideEffect ?? (()=>[]),
               list:       item.list ?? [],
            } as DialogItemResult<ITEM_NAMES>
         })
         const dialogDesc:DialogDesc<BUTTON_NAMES, ITEM_NAMES> = {
            title:         dialogConfig.title,
            items:         dialogItems,
            buttons:       dialogConfig.buttons.filter(b => b!==null), 
            description:   dialogConfig.description   
         }
         setConfig(dialogDesc)
         return new Promise<DlgReturn<BUTTON_NAMES, ITEM_NAMES>>
            ((resolve:(value: DlgReturn<BUTTON_NAMES, ITEM_NAMES>) => void) => {
               const ct = dialogDesc
               /** 
                * called when Dialog signals a resulting `action` being called. Thus ia usually triggered by one of the dialog buttons,
                * but can also originate elsewhere, e.g. when double clicking on a file 
                */
               act.current = (actionName:keyof BUTTON_NAMES) => {
                  // close the dialog box
                  ref.current?.close()
                  const items = Object.fromEntries((ct?ct.items : []).map(item => [item.id, item])) as {[property in keyof ITEM_NAMES]:DialogItemResult<ITEM_NAMES>}
                  // respond to open call with the result
                  resolve({
                     actionName:actionName as keyof BUTTON_NAMES, 
                     items,
                     value: <TYPE extends InputDataType>(property:keyof ITEM_NAMES) => {
                        const item = items[property] as DialogItemResult<ITEM_NAMES>
                        if (!items) throw Error(`undefined item name '${String(property)}' `)
                        return item.value as TYPE
                     }
                  })
               }
            })
      })
   },[open, config])

   const style = {top: pos.y, left: pos.x}
   const hasCancel = !!config?.buttons?.find(b => Object.keys(b)[0]===cancelButton)
   return <ErrorBoundary>
      <dialog ref={ref} style={style} className={styles.dialog} onMouseMove={duringMove} onMouseUp={endMove}>
         {config && <div className={styles.content}>
            <div className={styles.contentTitle} onMouseDown={startMove}>{config?.title}</div>
            {config?.description && <div className={styles.description}>{config.description}</div>}
            <div className={styles.contentArea}> 
               {config.items.map((item, i) => { 
                  const Handler = dialogItemHandlers[item.type] ?? dialogItemHandlers.default
                  return <Handler item={item} dialog={config} key={`${i}`} rerender={rerender} act={act.current}/>
               })}
            </div>
            <div className={styles.buttonArea}>  
               {config?.buttons?.map(button => {
                  const name = button.id
                  return !!button && <DlgButton name={name} button={button} act={act.current} dialog={config} key={`btn_${rerender.count()}_${String(name)}`}/>
               })}
               {!hasCancel && <button onClick={()=>act.current(cancelButton as keyof typeof act.current)} className={styles.cancel}>{cancelButton}</button>}
            </div>
         </div>}
      </dialog>
   </ErrorBoundary>

   function startMove(e:MouseEvent) {
      if (pos._x<=OFF_SCREEN) setPos({x:pos.x, y:pos.y, _x:e.clientX-pos.x, _y:e.clientY-pos.y})
   }
   function duringMove(e:MouseEvent) {
      if (pos._x>OFF_SCREEN) {
         setPos({x:e.clientX - pos._x, y:e.clientY - pos._y, _x:pos._x, _y:pos._y})
      }
   }
   function endMove(e:MouseEvent) {
      duringMove(e)
      if (pos._x>OFF_SCREEN) setPos({x:pos.x, y:pos.y, _x:OFF_SCREEN ,_y:OFF_SCREEN})
   }
}

function itemsLiteral<ITEM_NAMES>(items:DialogItemResult<ITEM_NAMES>[]):ItemsLiteral<ITEM_NAMES> {
   const result = {} as {[Property in keyof ITEM_NAMES]: any}
   items.forEach(item => result[item.id] = item)
   return result
}

/** 
 * Default dialog item implementation.
 * Implements the types 'number', 'date', 'boolean', 'select', 'text'; 
 * and treats any other types as 'text'.
 */
function dialogItemDefaultHandler<BUTTON_NAMES, ITEM_NAMES>({item, dialog, rerender}:{item:DialogItemResult<ITEM_NAMES>, dialog: DialogDesc<BUTTON_NAMES, ITEM_NAMES>, rerender:Rerender}) {
   const disabled = typeof item.disable==='boolean'? item.disable :  item.disable(itemsLiteral(dialog.items)) ?? false
   const classNameLabel = `${styles.elementLabel} ${disabled?styles.disabled:''}`
   const classNameValue = `${styles.elementValue} ${disabled?styles.disabled:styles.editable}`
   const label = item.label ?? item.key
   const list = typeof item.list === 'function'? item.list() : item.list
   return <div className={styles.dialogItem}>
      <span className={classNameLabel}>{label}</span>
      <Input type={item.type} disabled={disabled} name={item.key} value={item.value} key={`${item.key}_${item.value}`} onChange={update} list={list}  className={classNameValue}/>
   </div>
   function update(newValue:string) {
      switch(item.type) {
         case 'number': item.value = +newValue; break;
         case 'date':   item.value = new Date(`${newValue} 00:00`); break;
         case 'boolean':item.value = newValue==='on'? true : false; break;
         case 'select': 
         case 'text': 
         default:       item.value = newValue;
      }         
      item.isDefault = false
      doSideEffect(item, dialog.items)
      rerender()
   }
}
/** 
 * `None` dialog item implementation.
 * Implements the type 'none'; 
 */
function dialogItemNoneHandler<BUTTON_NAMES, ITEM_NAMES>({item, dialog}:{item:DialogItemResult<ITEM_NAMES>, dialog: DialogDesc<BUTTON_NAMES, ITEM_NAMES>, rerender:Rerender}) {
   const disabled = typeof item.disable==='boolean'? item.disable :  item.disable(itemsLiteral(dialog.items)) ?? false
   const classNameLabel = `${styles.elementLabel} ${disabled?styles.disabled:''}`
   const classNameValue = `${styles.noneValue} ${disabled?styles.disabled:''}`
   const label = item.label ?? item.key
   return <div className={styles.dialogItem}>
      <span className={classNameLabel}>{label}</span>
      <span  className={classNameValue}>{`${item.value}`}</span>
   </div>
}

export function doSideEffect<ITEM_NAMES>(item:DialogItemResult<ITEM_NAMES>, items:DialogItemResult<ITEM_NAMES>[]) {
   const changes = item.sideEffect?.(item.value, itemsLiteral(items)) ?? {}
   for (const name in changes) {
      const elmt = items.find(el => el.id===name)
      if (elmt?.isDefault && changes[name]!==undefined) elmt.value = changes[name]
   }
}

type DlgButtonProps<BUTTON_NAMES, ITEM_NAMES> = {
   name:    keyof BUTTON_NAMES
   button:  DialogButtonConfig<BUTTON_NAMES, ITEM_NAMES>
   dialog:  DialogDesc<BUTTON_NAMES, ITEM_NAMES>
   act:     (action:keyof BUTTON_NAMES)=>void
}
function DlgButton<BUTTON_NAMES, ITEM_NAMES>({name, button, dialog, act}:DlgButtonProps<BUTTON_NAMES, ITEM_NAMES>) {
   const [isPending, startTransition] = useTransition();
   const disabled = typeof button.disable==='boolean'? button.disable : button.disable?.(itemsLiteral(dialog.items))

   return <button onClick={e=>disabled?'':click(e)} disabled={isPending||disabled}>{name as string}</button>
   
   async function click(e:MouseEvent) {
      e.preventDefault()
      act(name);
   }
}




export type DialogItemHandlerProps<BUTTON_NAMES, ITEM_NAMES> = {
   item:       DialogItemResult<ITEM_NAMES>
   dialog:     DialogDesc<BUTTON_NAMES, ITEM_NAMES>
   rerender:   Rerender
   act:        (action:any)=>void
}

type DialogItemHandler = <BUTTON_NAMES, ITEM_NAMES>(props: DialogItemHandlerProps<BUTTON_NAMES, ITEM_NAMES>) => JSX.Element
type DialogItemHandlers = {
   [type:string]: DialogItemHandler
}






// const test = {
//    button: {Ok: true}
// }

// function testFn<Button>(test:Button) {
// }

// testFn(test)