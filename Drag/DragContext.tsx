import { DragEvent, ReactNode, useId, useState } 
                     from "react"
import { BaseProps } from "@hauke5/components/BaseProps"
import styles        from './Drag.module.scss'

type UseDraggableProps = {
   id?:              string
   notifyDropped?:   (dragID:string)=>void
}
export function useDraggable<E extends HTMLElement=HTMLDivElement>({id, notifyDropped}:UseDraggableProps) {
   const uid       = useId()

   const dragID = id ?? uid
   return {listeners:{onDragStart, onDragEnd}, dragID}

   function onDragStart(e:DragEvent<E>) {
      e.dataTransfer.setData("text", e.currentTarget.id);
      // console.log(`dragStart '${dragID}', ${e.currentTarget.id}`, e)
   }

   function onDragEnd(e:DragEvent<E>) {
      notifyDropped?.(dragID)
      // console.log(`dragEnd`, e)
   }
}

type UseDroppableProps = {
   id?:              string
   notifyDropped?:   (dragID:string, dropID:string)=>void
}
export function useDroppable<E extends HTMLElement=HTMLDivElement>({id, notifyDropped}:UseDroppableProps) {
   const [isOver, setIsOver] = useState(false)
   const uid       = useId()

   const dropID = id ?? uid
   return {listeners: {onDrop, onDragOver, onDragEnter, onDragLeave}, dropID, isOver}

   function onDrop(e:DragEvent<E>) {
      e.preventDefault()
      e.stopPropagation()
      setIsOver(false)
      const dragID = e.dataTransfer.getData('text')
      notifyDropped?.(dragID, dropID)
      // console.log(`drop @${dropID}: '${data}'`, e)
   }

   function onDragOver(e:DragEvent<E>) {
      e.preventDefault()
   }

   function onDragEnter(e:DragEvent<E>) {
      // e.preventDefault()
      setIsOver(true)
   }

   function onDragLeave(e:DragEvent<E>) {
      // e.preventDefault()
      setIsOver(false)
   }
}


export type DraggableProps = {
   id:               string
   notifyDropped?:   (dragID:string)=>void
   children:         ReactNode
}
export function Draggable({children, id, notifyDropped}:DraggableProps) {
   const {listeners, dragID} = useDraggable({id, notifyDropped})
   return <div draggable="true" id={dragID} className={styles.draggable} {...listeners}>
      {children}
   </div>
}

export type DropTargetProps = BaseProps &{
   id:               string
   notifyDropped?:   (dragID:string, dropID:string)=>void
   children:         ReactNode
}
export function DropTarget({children, id, notifyDropped, className, ...props}:DropTargetProps) {
   const {listeners, dropID, isOver} = useDroppable({id, notifyDropped})
   const dragOver = isOver? styles.dragOver : ''
   return <div id={dropID} className={`${styles.dropTarget} ${dragOver} ${className??''}`} {...listeners} {...props}>
      {children}
   </div>
}