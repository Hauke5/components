import { useEffect, useRef, useState } 
                           from 'react';
import { Dialog, OpenDialog }   
                           from '@hauke5/components/Dialog';
import { Menu }            from '@hauke5/components/Menu/Menu';
import { useDefaultMenu }  from '../hooks/useDefaultMenu';
import styles              from '../styles/proseEditor.module.scss'


export type OpenPopup = (xpos:number, ypos:number)=>Promise<void>

interface ProseEditorPopupMenuProps {
   open:    (openDialog:(xpos:number, ypos:number)=>Promise<void>)=>void
   // view:    EditorView,
}
export function ProseEditorPopupMenu({open}:ProseEditorPopupMenuProps) {
   const [menuStyle, setMenuStyle]  = useState({})
   const openDialog                 = useRef<OpenDialog>()
   const popupMenu                  = useRef<HTMLDialogElement>(null)
   const menuItems                  = useDefaultMenu(false, openDialog)

   useEffect(()=>{   
      // run once to provide opening hook
      open(openPopupMenu)
   },[open])

   return <>
      <dialog ref={popupMenu} onClick={closePopupMenu} style={menuStyle} className={styles.popupMenu}>
         <Menu items={menuItems} theme={'dark'}/>
      </dialog>
      <Dialog open={open => openDialog.current=open as OpenDialog}/>
   </>

   async function openPopupMenu(xpos:number, ypos:number) {
      popupMenu.current?.showModal()
      setMenuStyle({top:`${ypos-40}px`, left:`${xpos}px`})
   }
   function closePopupMenu() {
      popupMenu.current?.close()
   }
}

