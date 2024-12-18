/**
 * Because docs-editor is in an iframe, the Tag cookie required to open the correct version
 * is not available. This event is used to send the Tag cookie from the parent window to the iframe,
 * which then updates the cookie and reloads the page if the tag is different.
 */
export const EDITOR_TAG_INFO_EVENT = 'docs-editor-tag-info'
export const EDITOR_REQUESTS_TOTAL_CLIENT_RELOAD = 'docs-editor-requires-reload'
/** When the editor receives the tag event, it will either request a client reload, or confirm everything is good */
export const EDITOR_CONFIRMS_VERSIONS_MATCH = 'docs-editor-confirms-versions-match'
