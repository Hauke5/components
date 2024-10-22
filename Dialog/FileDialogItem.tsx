import { Fragment, MouseEvent, useEffect, useRef, useState } 
                        from "react"
import { mdiFileDocumentOutline, mdiFolder } 
                        from "@mdi/js"
import { useAppDesc }   from "lib/apps"
import { serverPathInfo } from "lib/fileIO/serverFileIO"
import { Scrollable }   from "../Scrollable"
import { Icon }         from "../Icon"
import { DialogButtonConfig, DlgConfig, DlgReturn, OpenDialog } 
                        from "./DialogTypes"
import styles           from './Dialog.module.scss'
import { Dialog, DialogItemHandlerProps, addDialogItemHandler, doSideEffect } 
                        from "./Dialog"


type DirItem = {
   name:string, 
   type:'file' | 'dir'
}

export const DlgKeys = {
   ReplaceButton: 'Replace',
   FileSelect:    'fileSelect'
}

export const saveButton = 'Save'

addDialogItemHandler('file', FileDialogItem)

function FileDialogItem<BUTTON_NAMES, ITEM_NAMES>({item, dialog, rerender, act: select}:DialogItemHandlerProps<BUTTON_NAMES, ITEM_NAMES>) {
   const {key:appKey}            = useAppDesc()
   const [path, setPath]         = useState<string>(item.initial as string ?? '')
   const [dirItems, setDirItems] = useState<DirItem[]>([])
   const [selected, setSelected] = useState<string|null>(null) //used for style effect only
   const openDialog              = useRef<<BUTTON_NAMES, ITEM_NAMES>(dialogConfig:DlgConfig<BUTTON_NAMES, ITEM_NAMES>)
      => Promise<DlgReturn<BUTTON_NAMES, ITEM_NAMES>>>()

   useEffect(() => {
      const list = item.list
      ? typeof item.list==='function'
         ? item.list()
         : item.list
      : []
      getFolderItems(path).then(info => {
         if (info) setDirItems([
            ...info.dirList.map(d => ({name:d, type:'dir'} as DirItem)),
            ...info.fileList.filter(f => {
               // if hidden file -> reject
               if (f[0]==='.') return false
               // if no extensions defined, allow all files
               if (list.length===0) return true
               // else, if file has no extension: reject
               const lastPeriod = f.lastIndexOf('.')
               if (lastPeriod<0) return false
               // else, pass if extension is allowed
               const ext = f.slice(lastPeriod)
               return list.includes(ext)
            }).map(d => ({name:d, type:'file'} as DirItem))
         ])
      })
      async function getFolderItems(path:string) {
         const info = await serverPathInfo(appKey, path)
   // console.log(`...found ${info?.fileList.length} files and ${info?.dirList.length} dirs in '${path}' '${info?.path}'`)
         return info
      }
   }, [path, item, appKey])

   function setDialogOpen() {

   }

   return <div className={styles.fileElement}>
      <PathChain />
      <Scrollable className={styles.filesArea}>{
         dirItems.map(i => {
            const cls = `${styles.item} ${i.type==='dir'?styles.folder:''} ${i.name===selected?styles.selected:''}`
            return <div key={i.name} onClick={e=>update(i, e)} onDoubleClick={e=>doubleClick(i, e)} className={cls}>
               <Icon mdi={i.type==='dir'?mdiFolder:mdiFileDocumentOutline} size={15}/>
               {i.name}
            </div>
         }) 
      }</Scrollable>
      <Dialog open={open=>openDialog.current=open as OpenDialog}/>
   </div>
   function update(dirItem:DirItem, e:MouseEvent) {
      item.isDefault = false
      item.value = [...path.split('/').filter(p=>p.length>0), dirItem.name].join('/') 
      if (dirItem.type==='dir') item.value += '/'
      setSelected(dirItem.name)
      doSideEffect(item, dialog.items)
      rerender()
   }
   async function doubleClick(dirItem:DirItem, e:MouseEvent) {
      item.isDefault = false
      const pathArr = path.split('/').filter(p=>p.length>0)
      const p = [...pathArr, dirItem.name].join('/') 
      if (dirItem.type==='dir') {
         setPath(p)
         item.value = p
         setSelected(null)
      } else {
         item.value = p
         if (hasSaveButton(dialog.buttons)) {
            if (dirItems.some(item => [...pathArr, item.name].join('/').indexOf(p)===0)) {
               const result = await openDialog.current?.({
                  title: `File exists`,
                  items:[],
                  buttons:[
                     {id:'Replace'},
                  ]
               })
               if (result?.actionName === 'Replace') {
                  select(DlgKeys.FileSelect)
               }
               return
            }
         }
         select(DlgKeys.FileSelect)
      }
   }

   function PathChain() {
      const parts = `ROOT/${path}`.split('/')
      return <div className={styles.pathArea}>
         {parts.filter(p=>p.length>0).map((p,i) => <Fragment key={i}>
            {i>0 && <span>/</span>}
            <span className={styles.pathPart} onClick={e=>navigateToPart(i, e)}>{`${p ?? ''}`}</span>
         </Fragment>)}
      </div>

      function navigateToPart(i:number, e:MouseEvent) {
         const newPath = parts.map((p,j)=> j===0?'':p).slice(0, i).join('/')
         if (newPath !== path) {
            setPath(newPath)
            item.value = newPath + '/'
            doSideEffect(item, dialog.items)
            rerender()
         }
      }
   }

   function hasSaveButton(buttons: DialogButtonConfig<BUTTON_NAMES, ITEM_NAMES>[]) {
      return buttons.some(b => b.id===saveButton)
   }
}

