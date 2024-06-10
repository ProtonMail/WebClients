/**
 * This event is posted by the editor to the client outside of the context of bridges.
 * This allows us to to deal with certain bridges, such that the client knows the editor is ready to receive invocations,
 * and the editor likewise knows the client is ready to receive invocations.
 */
export const EDITOR_READY_POST_MESSAGE_EVENT = 'docs-editor-ready'
