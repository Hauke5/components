import { Command }                  from 'prosemirror-state';
import { Node, NodeType }           from 'prosemirror-model'
import { setBlockType }             from "prosemirror-commands";
import { MarkdownSerializerState }  from 'prosemirror-markdown'
import { textblockTypeInputRule }   from 'prosemirror-inputrules';
import { Token }                    from 'markdown-it';
import headingWithID                from '../markdown/headingWithID';
import { GenericActions, NodeDef, RuleBinding }     
                                    from "../schema"
import { findParentNodeOfType }     from './nodeSupport';


const specName = 'heading'

const MAX_HDG = 6

type HeadingActions = GenericActions & {
   // isActive:   (level:number) => Command
   toggle:     (level:number) => Command
   wrapIn:     (level:number) => Command
}

const setHeadings = ()=>Object.fromEntries(Array(MAX_HDG).fill(1).map((_, i)=>
   [`Shift-Ctrl-${i}`, setHeading(i)]
))

export const heading:NodeDef<HeadingActions> = {
   specName,
   keys: () => ({ 
      // 'Ctrl->`':         heading.actions.toggle,
      // 'Ctrl-ArrowRight': heading.actions.wrapIn,
      ...setHeadings
   }),
   actions: {
      isActive:   (level:number) => isHeadingActive(level),
      toggle:     (level:number) => toggleHeading(level),
      wrapIn:     (level:number) => setHeading(level)
   },
   pasteRules: [],
   inputRules: headingsInputRules(MAX_HDG),
   schemaSpec: {
      attrs:      {level: {default: 1}},
      content:    '(text | image)*',
      group:      'block',
      defining: true,
      parseDOM: Array(6).fill(1).map((_, i) => (
         {tag: `h${i}`, attrs:{level:i}}
      )),
      toDOM(node:Node) { return ['h' + node.attrs.level, 0] }
   },
   toMarkdown(state: MarkdownSerializerState, node: Node) {
      state.write(state.repeat('#', node.attrs['level']) + ' ');
      state.renderInline(node);
      state.closeBlock(node);
   },
   fromMarkdown: {
      [specName]: {
         block: specName,
         getAttrs: (tok:Token, tokens:Token[], index:number) => {
            return { 
               level: parseLevel(tok.tag.slice(1)),
               id:    (tok as any).id ?? getTextID(tokens[index+1].content)
               // uuid:  `${Math.random().toString(36).slice(2, 9)}`
            }
         },
      },
   },
   markdownItPlugin: {
      ruleName:   'headingWithID',
      alt:        ['heading'],
      where:      {before:'heading'},
      ruleBlock:  headingWithID
   },
}

function getTextID(text:string) {
   return text.trim().replaceAll(/\W/g, '_')
}


const parseLevel = (levelStr: string | number) => {
   const level = parseInt(levelStr as string, 10);
   return Number.isNaN(level) ? undefined : level;
}

function headingsInputRules(max:number) {
   const levelRegex = (level:number) =>  new RegExp(`^(#{1,${level}})\\s$`)
   const rules:RuleBinding[] = []
   for (let i=1; i<=max; i++) {
      const regExp = levelRegex(i)
      rules.push((type:NodeType)=>textblockTypeInputRule(regExp, type, {level:i}))
   }
   return rules
}


function setHeading(level:number):Command {
   return (state, dispatch) => {
      const type = state.schema.nodes.heading
      if (!isHeadingActive(level)(state)) {
         return setBlockType(type, { level })(state, dispatch);
      }
      return false
   };
}

function toggleHeading(level:number): Command {
   return (state, dispatch) => {
      const type = state.schema.nodes.heading
      if (isHeadingActive(level)(state)) {
         const para = state.schema.nodes['paragraph']
         return setBlockType(para)(state, dispatch);
      }
      return setBlockType(type, { level })(state, dispatch);
   }
}

function isHeadingActive(level:number):Command {
   return (state):boolean => {
      const type = state.schema.nodes.heading
      const match = findParentNodeOfType(type, state.selection);
      if (!match) return false

      const { node } = match;
      if (level == null) return true
      return node.attrs['level'] === level;
   };
}
