// Todo-Lists

import MarkdownIt, { Token }  from "markdown-it"

// const TODO_REGEXP    = /^\[([ xX])?\](?: \{(\d\d\/\d\d\/\d\d)?(?:-(\d\d\/\d\d\/\d\d)?)?\})?(?=\s)/
// We are not parsing the dates here because it messes up amrdown-it's indentation calculation. 
// Date Parsing is now done at `listItem.ts`
const TODO_REGEXP    = /^\[([ xX])?\](?=\s)/
const ORDERED_REGEXP = /^((?:\d)+)[.)](?=\s)/

type OldState = {
   listIndent:number, 
   tShift:number, 
   sCount:number, 
   tight:boolean, 
   itemLines:[number, number]
}

type Attrs = {
   todoChecked:boolean|null
   olStart:    number|null
}

/**
 * A `markdown-it` plugin to identify and mark to do lists and ordered lists.
 * This plugin should inserted 
 * - before the standard `markdown-it` `list` plugin 
 * - and in the `paragraph` chain, where ist signals a silent mode termination in case of the new markup.
 *  
 * It provides parsing support for:
 * - todo lists starting with `[]`, `[ ]`, `[x]`, and `[X]`, setting the `Token's`  boolean `todoChecked` attribute to indicate 
 *   whether the list item was checked or not
 * - ordered lists starting with an arbitrary list index. The original implementation should support this but messes up the 
 *   indentation for a start index of more than one digit.
 */
export default function listToDoMarkdownPlugin (state:MarkdownIt.StateBlock, startLine:number, endLine:number, silent:boolean):boolean {
   let nextLine               = startLine
   let tight                  = true
   let isTerminatingParagraph = false
   let posAfterMarker         = 0
   let prevEmptyEnd           = false
   const attrs:Attrs = {
      todoChecked:   null,
      olStart:       null
   }

   if (!entryConditions())       return false
   if (!matchRegexp())             return false
   if (isTerminatingParagraph)   return false

   // For validation mode we can terminate immediately
   if (silent) { return true }

   const {token, markerCharCode, listTokIdx, listLines, terminatorRules, oldParentType} = openTodoList()

   while (nextLine < endLine) {
      let {contentStart, max, oldState} = startLineIteration(token)

      if (contentStart >= max && state.isEmpty(nextLine + 1)) {
         // workaround for this case
         // (list item is empty, list terminates before "foo"):
         // ~~~~~~~~
         //   -
         //
         //     foo
         // ~~~~~~~~
         state.line = Math.min(state.line + 2, endLine)
      } else {
         state.md.block.tokenize(state, nextLine, endLine)
      }

      closeLineIteration(oldState, token)
      if (!continueLoop()) break
   }

   closeTodoList(token, tight)
   return true


   function entryConditions():boolean {
      // if it's indented more than 3 spaces, it should be a code block
      if (state.sCount[nextLine] - state.blkIndent >= 4) { return false }

      // Special case:
      //  - item 1
      //   - item 2
      //    - item 3
      //     - item 4
      //      - this one is a paragraph continuation
      if (state.listIndent >= 0 &&
         state.sCount[nextLine] - state.listIndent >= 4 &&
         state.sCount[nextLine] < state.blkIndent) {
      return false
      }

      // limit conditions when list can interrupt
      // a paragraph (validation mode only)
      if (silent && state.parentType === 'paragraph') {
         // Next list item should still terminate previous list item;
         //
         // This code can fail if plugins use blkIndent as well as lists,
         // but I hope the spec gets fixed long before that happens.
         //
         if (state.sCount[nextLine] >= state.blkIndent) {
            // If we're starting a new list right after a paragraph, first line should not be empty.
            isTerminatingParagraph = state.skipSpaces(posAfterMarker) >= state.eMarks[nextLine]
         }
      }
      return true
   }

   /** Detect list type and position after marker */
   function matchRegexp():boolean {
      const start = state.bMarks[nextLine] + state.tShift[nextLine]
      const textLine = state.src.slice(start, state.eMarks[nextLine])
      let match:RegExpExecArray | null
      if (match = TODO_REGEXP.exec(textLine)) {
         attrs.todoChecked = (match[1]==='' || match[1]===' ')? false : match[1]?.length>0? true : null
      } else if (match = ORDERED_REGEXP.exec(textLine)) {
         attrs.olStart = +match[1]
      } else {
         return false
      }
      posAfterMarker = start + match[0].length
      return true
   }

   function openTodoList() {
      // We should terminate list on style change. Remember first one to compare.
      const markerCharCode = state.src.charCodeAt(posAfterMarker - 1)

      // Start list
      const listTokIdx = state.tokens.length

      let token:Token
      if (attrs.todoChecked!=null) {
         token = state.push('todo_list_open', 'ul', 1)
         token.attrs = [['todoList', '']]
      } else {
         token = state.push('ordered_list_open', 'ol', 1)
         token.attrs = [['start', `${attrs.olStart}`]]
      }

      const listLines:[number, number] = [nextLine, 0]
      token.map    = listLines
      token.markup = String.fromCharCode(markerCharCode)

      const terminatorRules = state.md.block.ruler.getRules('list')

      const oldParentType = state.parentType
      state.parentType = 'list'
      return {token, markerCharCode, listTokIdx, listLines, terminatorRules, oldParentType}
   }

   function closeTodoList(token:Token, tight:boolean) {
      token = attrs.todoChecked!=null
         ? state.push('todo_list_close', 'ul', -1)
         : state.push('ordered_list_close', 'ol', -1)
      token.markup = String.fromCharCode(markerCharCode)
   
      listLines[1] = nextLine
      state.line = nextLine
   
      state.parentType = oldParentType
   
      if (tight) markTightParagraphs(state, listTokIdx)   
   }

   function startLineIteration(token:Token) {
      let contentStart = posAfterMarker
      let max = state.eMarks[nextLine]

      const initial = state.sCount[nextLine] + posAfterMarker - (state.bMarks[nextLine] + state.tShift[nextLine])
      let offset = initial

      movePosPastWhitespace()

      let indentAfterMarker = contentStart >= max
         ? 1    // trimming space in "-    \n  3" case, indent is 1 here
         : offset - initial

      // If we have more than 4 spaces, the indent is 1
      // (the rest is just indented code block)
      if (indentAfterMarker > 4) indentAfterMarker = 1

      // "  -  test"
      //  ^^^^^ - calculating total length of this thing
      const indent = initial + indentAfterMarker

      // Run subparser & write tokens
      token        = state.push('list_item_open', 'li', 1)
      token.attrs = []
      if (attrs.todoChecked!==null) token.attrs.push(['todoChecked', `${attrs.todoChecked}`])
      
      token.markup = String.fromCharCode(markerCharCode)
      const itemLines:[number, number] = [nextLine, 0]
      token.map    = itemLines
      token.info = `${attrs.todoChecked ?? attrs.olStart}`

      // change current state, then restore it after parser subcall
      const oldState:OldState = {
         tight: state.tight,
         tShift: state.tShift[nextLine],
         sCount: state.sCount[nextLine],
         //  - example list
         // ^ listIndent position will be here
         //   ^ blkIndent position will be here
         listIndent: state.listIndent,
         itemLines
      }
      state.listIndent = state.blkIndent
      state.blkIndent = indent 

      state.tight = true
      state.tShift[nextLine] = contentStart - state.bMarks[nextLine]
      state.sCount[nextLine] = offset  
      
      return {contentStart, max, oldState}

      function movePosPastWhitespace() {
         while (contentStart < max) {
            const ch = state.src.charCodeAt(contentStart)
            if (ch === 0x09)        offset += 4 - (offset + state.bsCount[nextLine]) % 4
            else if (ch === 0x20)   offset++
            else break
            contentStart++
         }
      }
   }

   function closeLineIteration(oldState:OldState, token:Token) {
      // If any of list item is tight, mark list as tight
      if (!state.tight || prevEmptyEnd)
         tight = false

      // Item become loose if finish with empty line,
      // but we should filter last element, because it means list finish
      prevEmptyEnd = (state.line - nextLine) > 1 && state.isEmpty(state.line - 1)

      state.blkIndent = state.listIndent
      state.listIndent = oldState.listIndent
      state.tShift[nextLine] = oldState.tShift
      state.sCount[nextLine] = oldState.sCount
      state.tight = oldState.tight

      token        = state.push('list_item_close', 'li', -1)
      token.markup = String.fromCharCode(markerCharCode)

      nextLine = state.line
      oldState.itemLines[1] = nextLine   
   }

   function continueLoop():boolean {
      if (nextLine >= endLine) { return false }

      // Try to check if list is terminated or continued.
      if (state.sCount[nextLine] < state.blkIndent) { return false }

      // if it's indented more than 3 spaces, it should be a code block
      if (state.sCount[nextLine] - state.blkIndent >= 4) { return false }

      // fail if terminating block found
      let terminate = false
      for (let i = 0, l = terminatorRules.length; i < l; i++) {
         if (terminatorRules[i](state, nextLine, endLine, true)) {
            terminate = true
            break
         }
      }
      if (terminate) return false 

      // fail if list has another type
      if (!matchRegexp()) return false
      if (markerCharCode !== state.src.charCodeAt(posAfterMarker - 1)) return false
      
      return true
   }
}


function markTightParagraphs(state:MarkdownIt.StateBlock, idx:number) {
  const level = state.level + 2
  for (let i = idx + 2, l = state.tokens.length - 2; i < l; i++) {
      if (state.tokens[i].level === level && state.tokens[i].type === 'paragraph_open') {
         state.tokens[i + 2].hidden = true
         state.tokens[i].hidden = true
         i += 2
      }
   }
}
