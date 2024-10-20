import {Mark, Node}           from 'prosemirror-model'
import { MarkdownParser, MarkdownSerializer, MarkdownSerializerState, ParseSpec } 
                              from 'prosemirror-markdown';
import MarkdownIt             from "markdown-it"
import { sup, sub, mark, underline } 
                              from '../Marks';
import { markDefs, nodeDefs, schema }    
                              from '../schema';
import { heading, todoList }  from '../Nodes';


export type MarkdownSpec<T extends MarkSerializerSpec|NodeSerializerSpec> = {
   specName:      string
   /** definitions used by `prosemirror's` `MarkdownSerializer` to convert mark or node types into markdown text  */
   toMarkdown:    T
   /** definitions used by `prosemirror's` `MarkdownParser` to convert markdown text into mark or node types */
   fromMarkdown:  ParserSpec
}

// export type ToMarkdown = (state: MarkdownSerializerState, node: Node, parent: Node, index: number) => void
export type ParserSpec = {[name: string]: ParseSpec}

export const markdownSerializer = new MarkdownSerializer(
   Object.fromEntries(nodeDefs.filter(n=>!!(n as any).toMarkdown).map(node => [node.specName, node.toMarkdown])),
   Object.fromEntries(markDefs.map(mark => [mark.specName, mark.toMarkdown]).filter(([,toMarkdown])=>toMarkdown!==undefined))
)


const tokenizer = MarkdownIt()
   .use(markdownItRule(mark))
   .use(markdownItRule(sub))
   .use(markdownItRule(sup))
   .use(markdownItRule(underline))
   .use(markdownItRule(todoList))
   .use(markdownItRule(heading))

const tokens:ParserSpec = Object.fromEntries([...markDefs, ...nodeDefs]
   .map(item => item.fromMarkdown)
   .filter(fromMarkdown  => !!fromMarkdown)
   .flatMap(fromMarkdown => Object.entries(fromMarkdown)))

export const markdownParser = new MarkdownParser(schema, tokenizer, tokens)


export type NodeSerializerSpec = (state: MarkdownSerializerState, node: Node, parent: Node, index: number) => void
export type MarkSerializerSpec = {
   /** 
    * The string that should appear before a piece of content marked
    * by this mark, either directly or as a function that returns an
    * appropriate string.
    */
   open: string | ((state: MarkdownSerializerState, mark: Mark, parent: Node, index: number) => string),
   /**
    * The string that should appear after a piece of content marked by
    * this mark.
    */
   close: string | ((state: MarkdownSerializerState, mark: Mark, parent: Node, index: number) => string),
   /** 
    * When `true`, this indicates that the order in which the mark's
    * opening and closing syntax appears relative to other mixable
    * marks can be varied. (For example, you can say `**a *b***` and
    * `*a **b***`, but not `` `a *b*` ``.)
    */
   mixable?: boolean,
   /** 
    * When enabled, causes the serializer to move enclosing whitespace
    * from inside the marks to outside the marks. This is necessary
    * for emphasis marks as CommonMark does not permit enclosing
    * whitespace inside emphasis marks, see:
    * http:///spec.commonmark.org/0.26/#example-330
    */
   expelEnclosingWhitespace?: boolean,
   /**
    * Can be set to `false` to disable character escaping in a mark. A
    * non-escaping mark has to have the highest precedence (must
    * always be the innermost mark).
    */
   escape?: boolean
}


type MarkdownItCoreRule = {
   ruleCore:   RuleCore
}
type MarkdownItInlineRule = {
   ruleInline: RuleInline
}
type MarkdownItBlockRule = {
   ruleBlock: RuleBlock
}
type MarkdownItRule = MarkdownItInlineRule | MarkdownItCoreRule | MarkdownItBlockRule
type MarkdownItPlugin<RULE extends MarkdownItRule> = RULE & {
   ruleName:   string
   alt?:       string[]
   where:      {
      before?: string
      after?:  string
   },
}
export type MarkdownPlugin<RULE extends MarkdownItRule = MarkdownItRule> = {
   specName:            string
   /** 
    * a plugin that will be inserted into one or more `markdown-it` chains to allow markdown sequences to be marked as specific tokens 
    */
   markdownItPlugin?:   MarkdownItPlugin<RULE>
}

export type RuleCore     = MarkdownIt.Core.RuleCore
export type RuleInline   = MarkdownIt.ParserInline.RuleInline
export type RuleBlock    = MarkdownIt.ParserBlock.RuleBlock


function markdownItRule(mark:MarkdownPlugin) { 
   const ruleName = mark.specName 
   if (!mark.markdownItPlugin) {
      throw new Error(`no plugin defined for '${ruleName}'`) 
   }
   return (md:MarkdownIt) => {
      let rule:RuleInline | RuleCore | RuleBlock
      let ruler:MarkdownIt.Ruler<RuleCore | RuleInline | RuleBlock>
      if (!mark.markdownItPlugin)
         throw new Error(`expected a plugin in spec '${ruleName}'`)
      const corePlugin = mark.markdownItPlugin as MarkdownItPlugin<MarkdownItCoreRule>
      const blockPlugin = mark.markdownItPlugin as MarkdownItPlugin<MarkdownItBlockRule>
      const inlinePlugin = mark.markdownItPlugin as MarkdownItPlugin<MarkdownItInlineRule>
      if (corePlugin.ruleCore) {
         rule  = corePlugin.ruleCore
         ruler = md.core.ruler
      } else if (blockPlugin.ruleBlock) {
         rule  = blockPlugin.ruleBlock
         ruler = md.block.ruler
      } else if (inlinePlugin.ruleInline) {
         rule  = inlinePlugin.ruleInline
         ruler = md.inline.ruler
      } else         
         throw new Error(`expected a plugin rule in spec '${ruleName}'`)

      const opts = mark.markdownItPlugin.alt ? {alt:mark.markdownItPlugin.alt} : undefined
      if (mark.markdownItPlugin.where.before)
         ruler.before(mark.markdownItPlugin!.where.before, ruleName, rule, opts)
      else
         ruler.after(mark.markdownItPlugin!.where.after ?? 'emphasis', ruleName, rule, opts)
   }
}
