import MarkdownIt       from "markdown-it";
import { RuleInline }   from "./markdown";

// same as UNESCAPE_MD_RE plus a space
const UNESCAPE_RE = /\\([ \\!"#$%&'()*+,./:;<=>?@[\]^_`{|}~-])/g
const NonWordRegexp = /\W/
const WhiteSpaceRegexp = /\s/

export function markdownMarkRule(markerSeq:string, ruleName:string, tag:string):RuleInline { 
   const name = `markPlugin_${ruleName}`
   // using `name` and named rule to provide the rule with a name in the debugger
   const rule = {[name]: (state:MarkdownIt.StateInline, silent:boolean):boolean => {
      const max = state.posMax
      const start = state.pos
      if (state.src.indexOf(markerSeq, state.pos) !== start) { return false }
      // hs 9/15/24: find markers only after a whitespace:
      if (state.pos>0 && !isWhitespaceChar(state.src[state.pos-1])) return false
      if (silent) { return false } // don't run any pairs in validation mode
      if (start + 2 >= max) { return false }

      state.pos = start + markerSeq.length
      let found = false

      while (state.pos < max) {
         const index = state.src.indexOf(markerSeq, state.pos)
         if (index === state.pos) {
            // hs 9/15/24: find markers only at the end of a word:
            if (state.pos===state.src.length-1 || isNonWordChar(state.src[state.pos+1])) {
               found = true
               break
            }
         }
         state.md.inline.skipToken(state)
      }

      if (!found || start + 1 === state.pos) {
         state.pos = start
         return false
      }

      const content = state.src.slice(start + markerSeq.length, state.pos)

      // don't allow unescaped spaces/newlines inside
      // HS 3/30/24: disabled this to allow for multi-word marks, which would include unescaped spaces
      // if (content.match(/(^|[^\\])(\\\\)*\s/)) {
      //    state.pos = start
      //    return false
      // }

      // found!
      state.posMax = state.pos
      state.pos = start + markerSeq.length

      // Earlier we checked !silent, but this implementation does not need it
      const token_so = state.push(`${ruleName}_open`, tag, 1)
      token_so.markup = markerSeq

      const token_t = state.push('text', '', 0)
      token_t.content = content.replace(UNESCAPE_RE, '$1')

      const token_sc = state.push(`${ruleName}_close`, tag, -1)
      token_sc.markup = markerSeq

      state.pos = state.posMax + markerSeq.length
      state.posMax = max
      return true
   }}
   return rule[name]
}


function isWhitespaceChar(char:string):boolean {
   return WhiteSpaceRegexp.test(char);}

function isNonWordChar(char:string):boolean {
   return NonWordRegexp.test(char);}