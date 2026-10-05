import { $getEditor, type LexicalEditor } from 'lexical'

// Lexical's JSON clipboard export uses excludeFromCopy('html') too. Only the
// private cut snapshot may retain these marks; public clipboard formats never do.
const cutMarkIDs = new WeakMap<LexicalEditor, Set<string>>()

export function $isSerializingCommentCut(ids: string[]): boolean {
  const allowed = cutMarkIDs.get($getEditor())
  return allowed !== undefined && ids.some((id) => allowed.has(id))
}

export function withCommentCutSerialization<T>(editor: LexicalEditor, ids: Set<string>, serialize: () => T): T {
  cutMarkIDs.set(editor, ids)
  try {
    return serialize()
  } finally {
    cutMarkIDs.delete(editor)
  }
}
