import { MutableRefObject, useEffect, useRef }   
                                    from 'react';
import { EditorView }               from 'prosemirror-view';
import { mdiFormatListNumbered }    from '@mdi/js';
import { useAppDesc }               from '@hauke5/lib/apps';
import { Log }                      from '@hauke5/lib/utils';
import { OpenDialog }               from '@hauke5/components/Dialog';
import { MenuItem, MenuItemSpec, menuSeparator }   
                                    from '@hauke5/components/Menu/Menu';
import { menuItemSpecs }            from '../menu/menuItemSpecs';
import { useCurrentEditorViewRef }  from './useCurrentEditorView';

const log = Log(`useDefaultMenu`).debug

/**
 * return a list of standard menu items for use in `ProseEditorMenu`.
 * @param compressed (default=false): if `true`, items are organized in pulldown menus for a more compressed display
 * @param openDialog use
 * @returns 
 */
export function useDefaultMenu(compressed=false, openDialog?:MutableRefObject<OpenDialog | undefined>):MenuItem[] {
   const viewRef     = useCurrentEditorViewRef()
   const defaultMenu = useRef(getMenu(compressed, viewRef, openDialog?.current))
   useEffect(()=>{
      log(`useEffect`)
      defaultMenu.current = getMenu(compressed, viewRef, openDialog?.current)
   },[compressed, openDialog, viewRef])
   log(`render ${defaultMenu.current.length} items`)
   return defaultMenu.current
}

function getMenu<ITEMS>(compressed:boolean, viewRef:MutableRefObject<EditorView | null>, openDialog?:OpenDialog) {
   log(`getMenu ${viewRef.current?'viewRef defined':'no viewRef'}`)
   // if (!viewRef.current) return []
   const items = menuItemSpecs<ITEMS>(viewRef, openDialog, )
   return compressed ? [
      items.undo(), items.redo(),
      menuSeparator('ver'),
      textSubmenu(), 
      items.link(),
      menuSeparator('ver'),
      blockTypeSubmenu(),
      menuSeparator('ver'),
      listSubmenu(),
   ] : [
      items.undo(), items.redo(),
      menuSeparator('ver'),
      items.bold(), items.italic(), items.underline(), items.strikethrough(), items.code(), items.super(), items.sub(), items.mark(),
      items.link(),
      menuSeparator('ver'),
      blockTypeSubmenu(),
      menuSeparator('ver'),
      listSubmenu(),
   ]

   function blockTypeSubmenu():MenuItemSpec {
      return {
         hint:          'Plain, Headings, Codeblock',
         // icon:          mdiFormatHeaderPound,
         label:         'Block...',
         subItems:      [items.paragraph(), ...Array(6).fill(1).map((a, i) => items.heading(i+1)), items.blockQuote(), items.code_block()]
      }
   }
   function textSubmenu():MenuItemSpec {
      return {
         hint:          'Font style',
         // icon:          mdiFormatItalic,
         label:         'Text...',
         subItems:      [items.bold(false), items.italic(false), items.underline(false), items.strikethrough(false), items.code(false), items.super(false), items.sub(false), items.mark(false)]
      }
   }
   function listSubmenu():MenuItemSpec {
      return {
         hint:          'List styles',
         icon:          mdiFormatListNumbered,
         label:         'List...',
         subItems: [
            items.bulletList(), 
            items.orderedList(), 
            items.toDoList(), 
            items.indentList(), 
            items.outdentList(),
            items.hideCompletedTodos(),
         ]
      }
   }
}

