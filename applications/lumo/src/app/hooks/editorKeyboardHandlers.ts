import { TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { Editor } from '@tiptap/react';

import { BLOCK_NODE_TYPES, LIST_ITEM_NODE } from './editorConstants';

/**
 * Handles Enter key press on mobile devices
 * Creates a hard break instead of submitting or creating new paragraph
 *
 * @param e - Keyboard event
 * @param editor - TipTap editor instance
 * @returns true if event was handled
 */
export const handleMobileEnterKey = (e: KeyboardEvent, editor: Editor | null): boolean => {
    e.preventDefault();
    // Insert hard break instead of new paragraph to avoid double spacing
    editor?.commands.setHardBreak();
    return true;
};

/**
 * Checks if the current position is inside a list
 *
 * @param view - ProseMirror editor view
 * @param editor - TipTap editor instance
 * @returns true if cursor is inside a list
 */
export const isInList = (view: EditorView, editor: Editor | null): boolean => {
    const { state } = view;
    const { $from } = state.selection;
    // $from is ProseMirror's resolved position object with context about the selection
    return (
        $from.node(-1)?.type.name === LIST_ITEM_NODE ||
        editor?.isActive('bulletList') ||
        editor?.isActive('orderedList') ||
        false
    );
};

/**
 * Exits a block node (heading, code block, blockquote) by inserting a new paragraph after it
 *
 * @param view - ProseMirror editor view
 * @param e - Keyboard event
 * @returns true if event was handled
 */
export const exitBlockNode = (view: EditorView, e: KeyboardEvent): boolean => {
    e.preventDefault();
    const { state } = view;
    const { $from } = state.selection;
    // $from is ProseMirror's resolved position - get position after current node
    const pos = $from.after();
    const tr = state.tr.insert(pos, state.schema.nodes.paragraph.create());
    view.dispatch(tr.setSelection(TextSelection.create(tr.doc, pos + 1)));
    return true;
};

/**
 * Exits a list by inserting a new paragraph after the current list item
 *
 * @param view - ProseMirror editor view
 * @param e - Keyboard event
 * @returns true if event was handled
 */
export const exitList = (view: EditorView, e: KeyboardEvent): boolean => {
    e.preventDefault();
    const { state } = view;
    const { $from } = state.selection;

    // Find the list item depth and get position after it
    const listItemDepth = $from.depth - 1;
    const posAfterListItem = $from.after(listItemDepth);

    // Insert a new paragraph AFTER the current list item
    const tr = state.tr.insert(posAfterListItem, state.schema.nodes.paragraph.create());

    const mappedPos = tr.mapping.map(posAfterListItem);
    view.dispatch(tr.setSelection(TextSelection.create(tr.doc, mappedPos + 1)));
    return true;
};

/**
 * Handles Shift+Enter key press on desktop
 * - Exits block nodes (heading, code, blockquote)
 * - Exits lists
 * - Creates hard break for regular paragraphs
 *
 * @param view - ProseMirror editor view
 * @param e - Keyboard event
 * @param editor - TipTap editor instance
 * @param nodeType - Current node type name
 * @param isInListNode - Whether cursor is in a list
 * @returns true if event was handled
 */
export const handleDesktopShiftEnter = (
    view: EditorView,
    e: KeyboardEvent,
    editor: Editor | null,
    nodeType: string,
    isInListNode: boolean
): boolean => {
    // Exit block nodes (heading, code, blockquote)
    if (BLOCK_NODE_TYPES.includes(nodeType as any)) {
        return exitBlockNode(view, e);
    }

    // Exit list if in list
    if (isInListNode) {
        return exitList(view, e);
    }

    // For regular paragraphs: create line break
    e.preventDefault();
    editor?.commands.setHardBreak();
    return true;
};

/**
 * Handles Enter key press on desktop (without shift)
 * - Exits block nodes (heading, code, blockquote)
 * - Allows default behavior for lists (create new list item)
 * - Submits message for regular paragraphs
 *
 * @param view - ProseMirror editor view
 * @param e - Keyboard event
 * @param editor - TipTap editor instance
 * @param nodeType - Current node type name
 * @param isInListNode - Whether cursor is in a list
 * @param onSubmitCallback - Callback to submit the message
 * @returns true if event was handled, false to allow default behavior
 */
export const handleDesktopEnter = (
    view: EditorView,
    e: KeyboardEvent,
    editor: Editor | null,
    nodeType: string,
    isInListNode: boolean,
    onSubmitCallback: (editor: Editor | null) => void
): boolean => {
    // Exit block nodes instead of submitting
    if (BLOCK_NODE_TYPES.includes(nodeType as any)) {
        return exitBlockNode(view, e);
    }

    // If in list, allow default behavior (create new list item)
    if (isInListNode) {
        // Let ProseMirror handle it - don't prevent default
        return false;
    }

    // For regular paragraphs: submit the message
    e.preventDefault();
    onSubmitCallback(editor);
    return true;
};
