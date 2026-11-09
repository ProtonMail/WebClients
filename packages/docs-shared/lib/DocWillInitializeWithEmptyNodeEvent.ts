/**
 * The Yjs doc will emit this event before it it is about to initialize with an empty node.
 * The Docs editor package (`@proton-docs/docs-editor`) emits its own copy from `Plugins/Collaboration/initializeEditor.ts`; change both together.
 */
export const DocWillInitializeWithEmptyNodeEvent = 'sync'
