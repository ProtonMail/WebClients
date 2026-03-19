/**
 * Constants for TipTap editor configuration and behavior
 */

/**
 * Node types that should exit to a new paragraph on Enter/Shift+Enter
 * instead of creating new nodes or submitting
 */
export const BLOCK_NODE_TYPES = ['heading', 'codeBlock', 'blockquote'] as const;

/**
 * Node type identifier for list items in ProseMirror
 */
export const LIST_ITEM_NODE = 'listItem';

/**
 * HTML attributes for the editor element
 */
export const EDITOR_ATTRIBUTES = {
    class: 'composer flex-grow w-full resize-none markdown-rendering',
    contenteditable: 'true',
    autocorrect: 'on',
    autocomplete: 'on',
    autocapitalize: 'sentences',
    spellcheck: 'true',
} as const;
