export type Browser = 'chrome' | 'firefox';

/** Whether the extension's action icon sits in the browser toolbar.
 * `unknown` means the browser did not tell us — never assume unpinned. */
export type ToolbarPinState = 'pinned' | 'unpinned' | 'unknown';
