# Editor Component

A [NextJS](https://nextjs.org/) component package implementing a word processing editor in the browser. The `Editor` component uses [ProseMirror](https://prosemirror.net/) for the core functionality with a number of enhancements:

- using markdown formatting while editing in addition to GUI-style menu-based formatting
- reading and writing of markdown files
- Plugin extensions via the ProseMirror Plugin mechanism
- markdown extensions for ^superscript^, ~subscript~, ==marks==, ~~strikethrough~~

[x] {10/20/24-10/20/24} markdown extensions for todo lists with created-closed dates display

### Available Plugins

#### out-of-the-box plugins
- triggering updated in selection and content via `useContentChange` and `useSelectionChange` hooks
- auto-hiding of closed todo items via menu

#### configurable app-level plugins for
- providing a **folding mechanism** for headings
- **autoSave** to file after content changes
- **word counting** per paragraph, heading, and document
- extensible **variables** mechanism to insert dynamic content into the document, such as the time or date of last edit, ot a table of contents
- `tocPlugin` to add tables of content via a `variable

