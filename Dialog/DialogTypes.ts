'use client'
import { ReactNode }       from "react"
import { InputDataType }   from "../Input/Input";


export type OpenDialog = <BUTTON_NAMES, ITEM_NAMES>(dialogConfig:DlgConfig<BUTTON_NAMES, ITEM_NAMES>)
   => Promise<DlgReturn<BUTTON_NAMES, ITEM_NAMES>>


export type DlgConfig<BUTTON_NAMES, ITEM_NAMES> = {
   title:         string
   description?:  ReactNode
   items?:        DialogItemConfig<ITEM_NAMES>[]
   buttons:       (DialogButtonConfig<BUTTON_NAMES, ITEM_NAMES>|null)[]
}

export type DlgReturn<BUTTON_NAMES, ITEM_NAMES> = {
   actionName?:   keyof BUTTON_NAMES
   items:         {[property in keyof ITEM_NAMES]:DialogItemResult<ITEM_NAMES>}
   value:         <TYPE extends InputDataType>(property:keyof ITEM_NAMES)=>TYPE
}

export type DialogButtonConfig<BUTTON_NAMES, ITEM_NAMES> = {
   id:            keyof BUTTON_NAMES
   /** a function returning `true` if the element should be disabled */
   disable?:      boolean | ((items:ItemsLiteral<ITEM_NAMES>)=>boolean)
   /** the display label shown in the dialog; defaults to `key` */
   label?:        ReactNode
}
type DialogItemBaseConfig<ITEM_NAMES, ITEM_TYPE> = DialogButtonConfig<ITEM_NAMES, ITEM_NAMES> & {
   id:            keyof ITEM_NAMES
   type:          ITEM_TYPE
   /** the value to initialize the dialog */
   initial?:      InputDataType 
   /** 
    * optional, will be called when changes occur to one dialog element. 
    * This function can trigger updates on other dialog elements that depend on this element 
    */
   sideEffect?:   (value:InputDataType, items:ItemsLiteral<ITEM_NAMES>)=>{[Property in keyof ITEM_NAMES]?:InputDataType}
   /** optional array of strings that provide a suggestion drop-down for text/select/file inputs  */
   list?:         ITEM_TYPE extends 'text'|'select'|'file'? (string[] | (() => string[])) : undefined
}
type DialogItemNumberConfig<ITEM_NAMES>   = DialogItemBaseConfig<ITEM_NAMES, 'number'> 
type DialogItemBooleanConfig<ITEM_NAMES>  = DialogItemBaseConfig<ITEM_NAMES, 'boolean'> 
type DialogItemDateConfig<ITEM_NAMES>     = DialogItemBaseConfig<ITEM_NAMES, 'date'>
type DialogItemTextConfig<ITEM_NAMES>     = DialogItemBaseConfig<ITEM_NAMES, 'text'>
type DialogItemSelectConfig<ITEM_NAMES>   = DialogItemBaseConfig<ITEM_NAMES, 'select'> 
type DialogItemFileConfig<ITEM_NAMES>     = DialogItemBaseConfig<ITEM_NAMES, 'file'>
type DialogItemNoneConfig<ITEM_NAMES>     = DialogItemBaseConfig<ITEM_NAMES, 'none'>      // a non-editable field
type DialogItemConfig<ITEM_NAMES> = 
   DialogItemNumberConfig<ITEM_NAMES> | 
   DialogItemBooleanConfig<ITEM_NAMES> | 
   DialogItemTextConfig<ITEM_NAMES> |
   DialogItemDateConfig<ITEM_NAMES> | 
   DialogItemSelectConfig<ITEM_NAMES> | 
   DialogItemFileConfig<ITEM_NAMES> |
   DialogItemNoneConfig<ITEM_NAMES>


type ItemType = 'number' | 'boolean' | 'text' | 'date' | 'select' | 'file'

type DialogResultBase = {
   key:           string
   value:         InputDataType
   isDefault:     boolean
}
type DialogItemBase<ITEM_NAMES, ITEM_TYPE extends ItemType> = 
   DialogResultBase & Required<DialogItemBaseConfig<ITEM_NAMES, ITEM_TYPE>>
   

type DialogItemNumber<ITEM_NAMES>   = DialogItemBase<ITEM_NAMES, 'number'>
type DialogItemBoolean<ITEM_NAMES>  = DialogItemBase<ITEM_NAMES, 'boolean'>
type DialogItemText<ITEM_NAMES>     = DialogItemBase<ITEM_NAMES, 'date'>
type DialogItemDate<ITEM_NAMES>     = DialogItemBase<ITEM_NAMES, 'text'> 
type DialogItemSelect<ITEM_NAMES>   = DialogItemBase<ITEM_NAMES, 'select'>
type DialogItemFile<ITEM_NAMES>     = DialogItemBase<ITEM_NAMES, 'file'>
export type DialogItemResult<ITEM_NAMES> = 
   DialogItemNumber<ITEM_NAMES> | 
   DialogItemBoolean<ITEM_NAMES> | 
   DialogItemText<ITEM_NAMES> | 
   DialogItemDate<ITEM_NAMES> | 
   DialogItemSelect<ITEM_NAMES> | 
   DialogItemFile<ITEM_NAMES>


export type DialogDesc<BUTTON_NAMES, ITEM_NAMES> = {
   title:         string;
   description?:  ReactNode
   items:         DialogItemResult<ITEM_NAMES>[]
   buttons:       DialogButtonConfig<BUTTON_NAMES, ITEM_NAMES>[]
   class?:        string;
   style?:        string;
}

export type ItemsLiteral<ITEM_NAMES>   = { [Property in keyof ITEM_NAMES]: DialogItemResult<ITEM_NAMES> } 

