import { useEffect, useRef, useState }   
                                 from 'react';
import { Dialog, OpenDialog }    from '@hauke5/components/Dialog';
import { Log }                   from '@hauke5/lib/utils';
import { Menu, MenuItem}   
                                 from '@hauke5/components/Menu/Menu';
import { BaseProps }             from '@hauke5/components/BaseProps';
import { useSelectionChange }    from '../hooks/useChange';
import { useDefaultMenu }        from '../hooks/useDefaultMenu';
import { useEditorContext }      from '../hooks/useEditorContext';
import styles                    from './menuPopup.module.scss'

const log = Log(`EditorMenu`).info

type ProseEditorMenuProps = BaseProps & {
   items?:  MenuItem[]
}
export function EditorMenu({items, ...props}:ProseEditorMenuProps) {
   const openDialog                = useRef<OpenDialog>()
   const {currentView}             = useEditorContext()
   const change                    = useSelectionChange(currentView)
   const defaultItems              = useDefaultMenu(false, openDialog)
   const [menuItems, setMenuItems] = useState<MenuItem[]>(items ?? defaultItems)

   useEffect(()=>{
      setMenuItems(items ?? defaultItems)
   },[items, defaultItems, defaultItems.length])

   return <>
      <Menu items={menuItems} className={styles.narrativeMenu} {...props} key={`_${change}`}/>
      <Dialog open={open=>openDialog.current=open as OpenDialog} className={styles.popover}/>
   </>
}

