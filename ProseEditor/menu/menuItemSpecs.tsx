import { MutableRefObject, useId }     from 'react'
import { mdiCancel, mdiCheckboxMultipleOutline, mdiCodeJson, mdiFormatIndentDecrease, mdiFormatIndentIncrease, 
         mdiFormatListBulletedSquare, mdiFormatListNumbered, mdiFormatSubscript, mdiFormatSuperscript, 
         mdiLink, mdiMarker, mdiOrderBoolAscendingVariant, mdiRedoVariant, mdiUndoVariant } 
                                       from '@mdi/js'
import { Command, EditorState }        from 'prosemirror-state'
import { undo, redo }                  from 'prosemirror-history'
import { EditorView }                  from 'prosemirror-view'
import { MenuItemSpec }                from '@hauke5/components/Menu/Menu'
import { OpenDialog }                  from '@hauke5/components/Dialog/DialogTypes'
import { Icon }                        from '@hauke5/components/Icon'
import { marks, nodes }                from '../setup/schema'
import { listItem }                    from '../setup/Nodes'
import { getLink }                     from '../setup/Marks'
import { hideCompletedTodosPluginKey } from '../plugins/hideCompletedTodosPlugin'
import styles                          from './menu.module.scss'

type MenuActions = {
   isActive?:     Command
   isDisabled?:   Command
   action?:       Command
}

export type ItemCommand = Command | ((...args:any[])=> Command)
export type ItemCommands = {[cmdName:string]: ItemCommand}
export type StandardCommands = ItemCommands & {
   isActive:  ItemCommand,
   toggle:    ItemCommand,
}

const {code, strong, italic, underline, strike, sup, sub, mark, link} = marks
const {code_block, blockQuote, bulletList, orderedList, todoList, heading, paragraph} = nodes

export type MenuItemSpecs<ITEMS> = {
   [Property in keyof ITEMS]:(...params:any[]) => MenuItemSpec
}

export function menuItemSpecs<ITEMS>(viewRef:MutableRefObject<EditorView | null>, openDialog?:OpenDialog) {
   // if (!view) return {}
   return {
      bold: (short=true)=> ({
         hint:          'Bold\n',
         label:         short? 'B' : 'Bold', 
         classNameLabel:styles.boldButton,
         hook:          getItemHook(viewRef, {
            action:     strong.actions.toggle?.(),
            isActive:   strong.actions.isActive(),
         })
      }) ,
      italic: (short=true)=> ({
         hint:          'Italic\n',
         label:         short? 'I' : 'Italic', 
         classNameLabel:styles.italicButton,
         hook:          getItemHook(viewRef, {
            action:     italic.actions.toggle?.(),
            isActive:   italic.actions.isActive(),
         })
      }),
      underline: (short=true)=> ({
         hint:          'Underline\n',
         label:         short? 'U' : 'Underline', 
         classNameLabel:styles.underlineButton,
         hook:          getItemHook(viewRef, {
            action:     underline.actions.toggle?.(),
            isActive:   underline.actions.isActive(),
         })
      }),
      strikethrough: (short=true)=> ({
         hint:          'Strike through\n',
         label:         short? 'S' : 'Strike', 
         classNameLabel:styles.strikeButton,
         hook:          getItemHook(viewRef,{
            action:     strike.actions.toggle?.(),
            isActive:   strike.actions.isActive(),
         })
      }),
      super: (short=true)=> ({
         hint:          'Superscript\n',
         icon:          short? mdiFormatSuperscript : undefined,
         label:         short? undefined : <span><sup>super</sup>-script</span>,
         hook:          getItemHook(viewRef, {
            action:     sup.actions.toggle?.(),
            isActive:   sup.actions.isActive(),
         })
      }),
      sub: (short=true)=> ({
         hint:          'Subscript\n',
         icon:          short? mdiFormatSubscript : undefined,
         label:         short? undefined : <span><sub>sub</sub>-script</span>,
         hook:          getItemHook(viewRef, {
            action:     sub.actions.toggle?.(),
            isActive:   sub.actions.isActive(),
         })
      }),
      mark: (short=true)=> ({
         hint:          'Mark\n',
         // className:     styles.mark,
         label:         short? <Icon mdi={mdiMarker} size={17} pre={true} className={styles.mark}/> : <mark>Mark</mark>,
         classNameLabel:styles.markButton,
         hook:          getItemHook(viewRef, {
            action:     mark.actions.toggle?.(),
            isActive:   mark.actions.isActive(),
         })
      }),
      link: ()=> ({
         hint:          'Link\n',
         icon:          mdiLink, 
         hook:          getLinkHook(viewRef, openDialog)
      }),
      code: (short=true)=> ({
         hint:          'Code\n',
         icon:          short? mdiCodeJson : undefined,
         label:         short? undefined : 'Code',
         classNameLabel:styles.codeButton,
         hook:          getItemHook(viewRef, {
            action:     code.actions.toggle?.(),
            isActive:   code.actions.isActive(),
         }),
      }),      
      code_block: ()=> ({
         hint:          'Code Block',
         // icon:          mdiCodeBlockBraces,
         label:         <pre className={styles.pre}>Code Block</pre>,
         hook:          getItemHook(viewRef, {
            action:     code_block.actions.toggle?.(),
            isActive:   code_block.actions.isActive(),
         }),
         isDisabled:    () => false
      }),      
      blockQuote: ()=> ({
         hint:          'Blockquote',
         // icon:          mdiFormatQuoteClose,
         label:         'Block Quote',
         classNameLabel:styles.blockQuote,
         hook:          getItemHook(viewRef, {
            action:     blockQuote.actions.toggle(),
            isActive:   blockQuote.actions.isActive(),
            isDisabled: ()=>false
         }),
         isDisabled:    () => false
      }),      
      bulletList: ()=> ({
         hint:          'bulleted list',
         label:         'Bullet List',
         icon:          mdiFormatListBulletedSquare,
         hook:          getItemHook(viewRef, {
            action:     bulletList.actions.wrapIn(),
            isActive:   bulletList.actions.isActive(),
            isDisabled: (state:EditorState)=> !paragraph.actions.isActive()(state)
         })
      }),      
      orderedList: ()=> ({
         hint:          'ordered list\n',
         label:         'Ordered List',
         icon:          mdiFormatListNumbered,
         hook:          getItemHook(viewRef, {
            action:     orderedList.actions.wrapIn(),
            isActive:   orderedList.actions.isActive(),
            isDisabled: (state:EditorState)=> !paragraph.actions.isActive()(state)
         })
      }),      
      toDoList: ()=> ({
         hint:          'to do list\n',
         label:         'To Do List',
         icon:          mdiOrderBoolAscendingVariant,
         hook:          getItemHook(viewRef, {
            action:     todoList.actions.wrapIn(),
            isActive:   todoList.actions.isActive(),
            isDisabled: (state:EditorState)=> !paragraph.actions.isActive()(state)
         })
      }),      
      hideCompletedTodos: ()=> ({
         hook:          hideCompletedTodos(viewRef)
      }),
      indentList: ()=> ({
         hint:          'list indent increase\n',
         label:         'Indent List',
         icon:          mdiFormatIndentIncrease,
         hook:          getItemHook(viewRef, {
            action:     listItem.actions.sinkItem(),
            isActive:   ()=>false,
            isDisabled: (state:EditorState)=> 
               !(bulletList.actions.isActive()(state) 
               || orderedList.actions.isActive()(state)
               || todoList.actions.isActive()(state))
         })
      }),      
      outdentList: ()=> ({
         hint:          'list indent decrease\n',
         label:         'Outdent List',
         icon:          mdiFormatIndentDecrease,
         hook:          getItemHook(viewRef, {
            action:     listItem.actions.liftItem(),
            isActive:   ()=>false,
            isDisabled: (state:EditorState)=>
               !(bulletList.actions.isActive()(state) 
            || orderedList.actions.isActive()(state)
            || todoList.actions.isActive()(state))
         })
      }),      
      undo: ()=> ({
         hint:          'Undo\n',
         icon:          mdiUndoVariant,
         hook:          getHistoryHook(viewRef, {
            action:     undo,
            isActive:   () => false
         })
      }),
      redo: ()=> ({
         hint:          'Redo\n',
         icon:          mdiRedoVariant,
         hook:          getHistoryHook(viewRef, {
            action:     redo,
            isActive:   () => false
         })
      }),
      heading: (level:number) => ({
         hint:          `Heading ${level}`,
         label:         `Heading ${level}`, 
         className:     styles[`h${level}Menu`],
         hook:          getItemHook(viewRef, {
            action:     heading.actions.wrapIn(level),
            isActive:   heading.actions.isActive(level)
         })
      }),
      paragraph: ()=> ({
         hint:          'Paragraph',
         label:         <span className={styles.codeButton}>Plain Paragraph</span>, 
         hook:          getItemHook(viewRef, {
            action:     paragraph.actions.toggle?.(),
            isActive:   paragraph.actions.isActive(),
            isDisabled:    () => false
         }),
      })
   }
}



function getItemHook(viewRef:MutableRefObject<EditorView | null>, item:MenuActions) {
   return (desc:MenuItemSpec):MenuItemSpec => {
      desc.action = () => {
         const view = viewRef.current
         if (view?.dispatch && item.action?.(view.state, view.dispatch, view)) view.focus();
      }
      desc.isActive = () => {
         const view = viewRef.current
         return (view?.state && item.isActive?.(view.state))? true : false
      }
      desc.isDisabled = item.isDisabled
         ? () => viewRef.current? item.isDisabled!(viewRef.current.state) : true
         : ()=> !(viewRef.current?.editable && item.action?.(viewRef.current.state))
      return desc
   }
}

function getHistoryHook(viewRef:MutableRefObject<EditorView | null>, item:MenuActions) {
   return (desc:MenuItemSpec):MenuItemSpec => {
      desc.action = () => {
         const view = viewRef.current
         if (view?.dispatch) item.action?.(view.state, view.dispatch, view)
      }
      desc.isActive   = ()=>false
      desc.isDisabled = ()=>false
      return desc
   }
}

function getLinkHook(viewRef:MutableRefObject<EditorView | null>, openDialog?:OpenDialog) {
   return (desc:MenuItemSpec):MenuItemSpec => {
      const id = useId()
      desc.id = id

      const state = viewRef.current?.state
      if (!state) return desc
      const {href, text} = getLink(state)
      desc.action =     () => text? doDialog() : undefined
      desc.isDisabled = () => (viewRef.current && text)?false:true
   
      async function doDialog() {
         const view = viewRef.current
         const results = await openDialog?.({
            title: `Add Link:`,
            items:[
               {id:'Text', type:'none',   initial:text,  label: 'Text:' },
               {id:'Link', type:'text',   initial:href,  label: 'Link:' },
            ],
            buttons:[
               {id:'Set',        disable:(values)=> (values.Text.value as string).length<=0},
               {id:'Clear Link', disable:(values) => values.Link.value===''}
            ]
         })
         if (results && view?.dispatch) {
            let href = results.items.Link.value
            switch(results.actionName) {
               case 'Clear Link': 
                  href = '';  // and fall through to 'Set'
               case 'Set': 
                  link.actions.createLink(href)(view.state, view.dispatch, view)
                  break
            }
         }
      }
      return desc 
   }     
}
  
function hideCompletedTodos(viewRef:MutableRefObject<EditorView | null>) {
   return (desc:MenuItemSpec):MenuItemSpec => {
      desc.action    = toggle
      desc.isActive  = isActive
      const active = isActive()
      desc.icon  = active? mdiCheckboxMultipleOutline: mdiCancel  
      desc.hint  = `${active?'show all hidden':'hide all'} completed todo items\nThis setting will become default for all Notebook pages`
      desc.label = `${active?'show hidden':'hide'} completed todos`
      return desc
   }
   function isActive() {
      const state = viewRef.current?.state
      return state
         ? !hideCompletedTodosPluginKey.getState(state)?.showToDos
         : false
   }
   function toggle() {
      const state = viewRef.current?.state
      if (state) {
         const tr = state.tr.setMeta(hideCompletedTodosPluginKey, true)
         viewRef.current!.dispatch(tr)
      }
   }
}