import {joinUp, joinDown, lift, selectParentNode, baseKeymap, chainCommands, newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock} 
                                 from "prosemirror-commands"
import {undo, redo}              from "prosemirror-history"
import {Command}                 from "prosemirror-state"
import {Attrs, MarkType, NodeType, Schema}         
                                 from "prosemirror-model"
import { Log }                   from "@hauke5/lib/utils"
import { listItem, listItemEnterCommand } 
                                 from "./Nodes"

export type KeyCommands    = {[key: string]: Command}

const log = Log(`keymap`)

/**
 * A mapping of key combinations (<Modifiers>-<key>) to `Commands`.
 * Modifiers are case insensitive.
 * - `Cmd`|`Mod`|`Meta`|`m` -> Apple-Command pressed
 * - `Alt` -> Apple-Option key pressed
 * - `Ctrl`|`control`|`c` -> Apple-Control pressed
 * - `Shift`|`s` -> Apple-Shift pressed
 */
export type KeyBindings<T extends MarkType|NodeType> = {
   [key:string]:((markType:T, attrs?: Attrs|null)=>Command)
}

/**
 * @deprecated; use `bindings` instead
 */
export type KeyMap<T extends MarkType|NodeType> = {
   keyBindings:   KeyBindings<T>
}

const mac = true     // typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false

/** 
 * create a map of base prosemirror key-Command bindings, adding bindings for `history` (undo/redo) 
 * and some rarer key bindings.
 * 
 * You can suppress or map these bindings by passing a `mapKeys`
 * argument, which maps key names (say `"Mod-B"`) to either `false`, to
 * remove the binding, or a new key name string.
 */
export function buildKeymap(schema:Schema, mapKeys?: {[key: string]: false | string}):KeyCommands {
   let keys: KeyCommands = Object.assign({}, baseKeymap, {
      "Enter": chainCommands(newlineInCode, createParagraphNear, liftEmptyBlock, listItemEnterCommand(listItem.specName), splitBlock)
   })

   bind("Mod-z",           undo)
   bind("Shift-Mod-z",     redo)
   if (!mac) bind("Mod-y", redo)

   bind("Alt-ArrowUp",     joinUp)
   bind("Alt-ArrowDown",   joinDown)
   bind("Mod-BracketLeft", lift)
   bind("Escape",          selectParentNode)

   return keys

   function bind(key: string, cmd: Command) {
      if (mapKeys) {
         let mapped = mapKeys[key]
         if (mapped === false) return
         if (mapped) {
            log(`replacing previous key '${key}' with mapped key '${mapped}'`)
            key = mapped
         }
      }
      if (keys[key]) {
         log(`replacing command for exisiting key '${key}'`)
      }
      keys[key] = cmd
   }
}
