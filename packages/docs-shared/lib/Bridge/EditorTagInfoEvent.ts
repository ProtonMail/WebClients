/**
 * Because docs-editor is in an iframe, the Tag cookie required to open the correct version
 * is not available. This event is used to send the Tag cookie from the parent window to the iframe,
 * which then updates the cookie and reloads the page if the tag is different.
 */
export const EDITOR_TAG_INFO_EVENT = 'docs-editor-tag-info'
export const EDITOR_WILL_RELOAD_DUE_TO_TAG_MISTMATCH = 'docs-editor-will-reload-due-to-tag-mismatch'
