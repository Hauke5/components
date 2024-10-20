import { Plugin }    from "prosemirror-state"
import { keymap }    from "prosemirror-keymap"
import { wrappingInputRule, textblockTypeInputRule, InputRule, inputRules} 
                     from "prosemirror-inputrules"
import {Fragment, Node, NodeType, Schema, Slice} 
                     from "prosemirror-model"
import { Log }       from "@hauke5/lib/utils"
import { BindingRules, PluginBinding, RuleBinding }   
                     from "../../schema"


const log = Log(`nodeRules`)

/** 
 * provides a `prosemirror` `plugin` for each of the `inputrules`, `pasteRules`, and `keys` 
 * in the provided `nodes`
 */
export function nodeRules(nodes:BindingRules[], schema: Schema):Plugin[] {
   return nodes.flatMap(node => {
      const type = schema.nodes[node.specName]
      const map = node.keys
         ? Object.fromEntries(Object
            .entries(node.keys())
            .map(([key, action])=> [key, action()]))
         : {}
      return [
         inputRules({rules: node.inputRules?.map(r => nodeInputRule(r, type)) ?? []}),
         ...node.pasteRules?.map(r => nodePastePlugin(r, type)) ?? [],
         ...node.nodeViewPlugins?.map(r => r()) ?? [],
         keymap(map)
      ]
   })
}

function nodeInputRule(binding:string|RegExp|RuleBinding, nodeType:NodeType) {
   if (typeof binding==='function') return binding(nodeType)
   throw new Error(`unexpected RegExp input rule for node '${nodeType.name}'`)
}

function nodePastePlugin(binding:string|RegExp|PluginBinding, nodeType:NodeType) {
   return typeof binding==='function'
         ? binding(nodeType)
         : new Plugin({props: {
            transformPasted: (slice) => new Slice(handler(slice.content), slice.openStart, slice.openEnd),
         }
      })
   // if (typeof binding === 'function') //return binding(nodeType)
   //    : new Plugin({props: {
   //       transformPasted: (slice) => new Slice(handler(slice.content), slice.openStart, slice.openEnd),
   //    },
// })   throw new Error(`unexpected RegExp input rule for node '${nodeType.name}'`)

   function handler(fragment: Fragment, parent?: Node):Fragment {
      return fragment
      // const nodes: Node[] = [];
      // const regexp = binding as RegExp
      // fragment.forEach((child) => {
      //    if (child.isText) {
      //       const { text, marks } = child
      //       let pos = 0
      //       let match:RegExpMatchArray|null
      //       const isLink = !!marks.filter((x) => x.type.name === 'link')[0]

      //       while (!isLink && (match = regexp.exec(text!)) !== null) {
      //          const start = match.index ?? 0
      //          const m = match.length - 1
      //          const textMatch = match[m];
      //          const exprMatch = match[0];
      //          const markMatch = match[m - 1];
            
      //          if (parent && parent.type.allowsMarkType(type) && markMatch) {
      //             const matchStart = start + exprMatch.indexOf(markMatch)
      //             const matchEnd   = start + exprMatch.length
      //             const textStart = matchStart + markMatch.indexOf(textMatch)
      //             const textEnd   = textStart + textMatch.length

      //             // adding text before markdown to nodes
      //             if (matchStart > 0) nodes.push(child.cut(pos, matchStart))

      //             // adding the markdown part to nodes
      //             nodes.push(child
      //                .cut(textStart, textEnd)
      //                .mark(type.create(attrs).addToSet(child.marks))
      //             )
      //             pos = matchEnd
      //          }
      //       }
      //       // adding rest of text to nodes
      //       if (pos < text!.length) nodes.push(child.cut(pos))
      //    } else {
      //       nodes.push(child.copy(handler(child.content, child)));
      //    }
      // })
      // return Fragment.fromArray(nodes);
   }
}

/**
 * Given a blockquote node type, returns an input rule that turns `"> "`
 * at the start of a textblock into a blockquote.
 */ 
export function blockQuoteRule(nodeType: NodeType) {
   return wrappingInputRule(/^\s*>\s$/, nodeType)
}

/**
 * Given a list node type, returns an input rule that turns a number
 * followed by a dot at the start of a textblock into an ordered list.
 */ 
export function orderedListRule(nodeType: NodeType) {
   return wrappingInputRule(/^(\d+)\.\s$/, nodeType, match => ({order: +match[1]}), (match, node) => node.childCount + node.attrs.order == +match[1])
}

/**
 * Given a list node type, returns an input rule that turns a bullet
 * (dash, plush, or asterisk) at the start of a textblock into a bullet list.
 */ 
export function bulletListRule(nodeType: NodeType) {
   return wrappingInputRule(/^\s*([-+*])\s$/, nodeType)
}

/**
 * Given a code block node type, returns an input rule that turns a
 * textblock starting with three backticks into a code block.
 */
export function codeBlockRule(nodeType: NodeType) {
   return textblockTypeInputRule(/^```$/, nodeType)
}

/**
 * Given a node type and a maximum level, creates an input rule that
 * turns up to that number of `#` characters followed by a space at
 * the start of a textblock into a heading whose level corresponds to
 * the number of `#` signs.
 */
export function headingRule(nodeType: NodeType, maxLevel: number) {
   const regex = new RegExp("^(#{1," + maxLevel + "})\\s$")
   return textblockTypeInputRule(regex, nodeType, match => ({level: match[1].length}))
}

/**
 * Given a node type and a maximum level, creates an input rule that 
 * turns up to that number of `#` characters followed by a space at
 * the start of a textblock into a heading whose level corresponds to
 * the number of `#` signs.
 */
export function horizontalRule(hr: NodeType) {
   return new InputRule(/^---$/, (state, match, start, end) => {
      let tr = state.tr.replaceWith(start-1, end, hr.create())
      return tr
   })
}
