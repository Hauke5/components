import { InputRule }    from 'prosemirror-inputrules'
import { Plugin, PluginKey } 
                        from 'prosemirror-state'
import { DirectEditorProps, EditorView } 
                        from 'prosemirror-view'
import { Node, NodeType }      
                        from 'prosemirror-model'
import { Token }        from 'markdown-it'
import { GenericActions, NodeDef }   
                        from "../schema"
import { quote }        from '../utils'
import { safeInsert }   from './nodeSupport/nodeTransforms'


const specName = 'image'

const AcceptFileType = 'image/*'

// ![abc](def 'ghi') => ["![abc](def 'ghi')", 'abc', 'def', 'ghi']
const INPUT_REGEX = /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/

type ImageAction = GenericActions & {}
export const image:NodeDef<ImageAction> = {
   specName,
   schemaSpec: {
      inline:     true,
      attrs: {
         src:     {},
         alt:     {default: null},
         title:   {default: null}
      },
      group:      'inline',
      draggable:  true,
      parseDOM: [{
         tag:     'img[src]', 
         getAttrs(dom:HTMLElement) {
            return {
               src:  dom.getAttribute('src'),
               title:dom.getAttribute('title'),
               alt:  dom.getAttribute('alt')
            }
         }
      }],
      toDOM(node:Node) { return ['img', node.attrs] }
   },
   pasteRules: [
      // pasteOrDropImage  // has issue: rules.match not defined 
   ],
   inputRules: [addImage],
   actions: {},
   toMarkdown(state, node) {
      const text = state.esc(node.attrs['alt'] || '');
      const url = state.esc(node.attrs['src']) +
                  (node.attrs['title'] ? ' ' + quote(node.attrs['title']) : '');
      state.write(`![${text}](${url})`);
   },
   fromMarkdown: {
      [specName]: {
         node: specName,
         getAttrs: (tok: Token) => ({
            src: tok.attrGet('src'),
            title: tok.attrGet('title') || null,
            alt: (tok.children![0] && tok.children![0]!.content) || null,
         }),
      },
   },
}



function addImage(type:NodeType) {
   return new InputRule(INPUT_REGEX,
      (state, match, start, end) => {
         let [, alt, src, title] = match;
         if (!src) return null;
         if (!title) title = alt;
         return state.tr.replaceWith(start, end, type.create({src, alt, title}),);
      },
   )
}

function pasteOrDropImage(type:NodeType) {
   return new Plugin({
      key: new PluginKey(specName + '-drop-paste'),
      props: {
         handleDOMEvents: {
            drop(view, _event) {
               const event = _event as DragEvent;

               if (event.dataTransfer == null) return false
               const files = getFileData(event.dataTransfer, AcceptFileType, true);
               // TODO should we handle all drops but just show error?
               // returning false here would just default to native behaviour
               // But then any drop handler would fail to work.
               if (!files || files.length === 0) return false;

               event.preventDefault();
               const coordinates = view.posAtCoords({left: event.clientX, top: event.clientY});

               createImageNodes(files, type, view)
                  .then((imageNodes) => {
                     addImagesToView(view, coordinates?.pos??undefined, imageNodes);
                  });
               return true;
            },
         } as DirectEditorProps['handleDOMEvents'],

         handlePaste: (view, rawEvent) => {
            const event = rawEvent;
            if (!event.clipboardData) return false;
            const files = getFileData(event.clipboardData, AcceptFileType, true);
            if (!files || files.length === 0) return false;
            createImageNodes(files, type, view)
               .then((imageNodes) => addImagesToView(view, view.state.selection.from, imageNodes))
            return true;
         },
      },
   })
}


function getFileData(data: DataTransfer, accept: string, multiple: boolean) {
   const dragDataItems = getMatchingItems(data.items, accept, multiple);
   const files: File[] = [];

   dragDataItems.forEach((item) => {
      const file = item && item.getAsFile();
      if (file == null) return;
      files.push(file);
   });

   return files;
}

function getMatchingItems(list: DataTransferItemList, accept: string, multiple: boolean) {
   const dataItems = Array.from(list);
   let results;

   // Return the first item (or undefined) if our filter is for all files
   if (accept === '') {
      results = dataItems.filter((item) => item.kind === 'file');
      return multiple ? results : [results[0]];
   }

   const accepts = accept
      .toLowerCase()
      .split(',')
      .map((accept) => accept.split('/').map((part) => part.trim()))
      .filter((acceptParts) => acceptParts.length === 2); // Filter invalid values

   const predicate = (item: DataTransferItem) => {
      if (item.kind !== 'file') return false;

      const [typeMain, typeSub] = item.type
         .toLowerCase()
         .split('/')
         .map((s) => s.trim());

      for (const [acceptMain, acceptSub] of accepts) {
         // Look for an exact match, or a partial match if * is accepted, eg image/*.
         if (typeMain === acceptMain && (acceptSub === '*' || typeSub === acceptSub)) 
            return true
      }
      return false;
   };

   results = results = dataItems.filter(predicate);
   if (multiple === false) results = [results[0]]
   return results;
}

async function createImageNodes(files: File[], imageType: NodeType, _view: EditorView) {
   let resolveBinaryStrings = await Promise.all(
      files.map((file) => readFileAsBinaryString(file)),
   );
   return resolveBinaryStrings.map((binaryStr) => imageType.create({src: binaryStr}));
}

function addImagesToView(view:EditorView, pos:number|undefined, imageNodes: Node[]) {
   for (const node of imageNodes) {
      const { tr } = view.state;
      let newTr = safeInsert(node, pos)(tr);
      if (newTr === tr) continue;
      view.dispatch(newTr);
   }
}

function readFileAsBinaryString(file: File): Promise<string> {
   return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const onLoadBinaryString: FileReader['onload'] = (readerEvt) => {
         const binarySrc = btoa(readerEvt.target!.result as string);
         resolve(`data:${file.type};base64,${binarySrc}`);
      };
      const onLoadDataUrl: FileReader['onload'] = (readerEvt) => {
         resolve(readerEvt.target!.result as string);
      };
      reader.onerror = () => {
         reject(new Error('Error reading file' + file.name));
      };

      // Some browsers do not support this
      if ('readAsDataURL' in reader) {
         reader.onload = onLoadDataUrl;
         reader.readAsDataURL(file);
      } else {
         // @ts-ignore reader was incorrectly inferred as 'never'
         reader.onload = onLoadBinaryString;
         // @ts-ignore
         reader.readAsBinaryString(file);
      }
   });
}




/**
 * 
 * 
 * ![abc](def "ghi")
 */