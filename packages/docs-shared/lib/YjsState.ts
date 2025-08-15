/**
 * The YJS encoded state of the editor. Unlike Lexical state, the Yjs state is more of a changelog of the document,
 * whereas the Lexical state is a static JSON snapshot of the current editor's state.
 */
export type YjsState = Uint8Array<ArrayBuffer>