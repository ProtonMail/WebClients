import React from 'react';

import { Placeholder } from '@tiptap/extension-placeholder';
import type { Editor } from '@tiptap/react';
import { useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { c } from 'ttag';

import { isMobile } from '@proton/shared/lib/helpers/browser';

import { PasteInterceptExtension } from '../extensions/PasteInterceptExtension';
import { htmlToMarkdown } from '../util/htmlToMarkdown';
import { shouldConvertPasteToAttachment } from '../util/pastedContentHelper';
import { EDITOR_ATTRIBUTES } from './editorConstants';
import { handleDesktopEnter, handleDesktopShiftEnter, handleMobileEnterKey, isInList } from './editorKeyboardHandlers';
import { usePasteCodeInterception } from './usePasteCodeInterception';

interface UseTipTapEditorProps {
    onSubmitCallback: (editor: Editor | null) => void;
    content?: string;
    isGenerating?: boolean;
    isProcessingAttachment?: boolean;
    isAutocompleteActive?: boolean;
    isAutocompleteActiveRef?: React.MutableRefObject<boolean>;
    onFocus?: () => void;
    onBlur?: () => void;
    onPasteLargeContent?: (content: string) => void;
}

/**
 * Custom hook for managing TipTap editor instance with paste interception,
 * keyboard handling, and markdown conversion.
 *
 * Features:
 * - Code detection on paste with user prompt
 * - Large content conversion to attachments
 * - Desktop/mobile keyboard behavior (Enter/Shift+Enter)
 * - Dynamic placeholder updates
 * - Markdown conversion for submission
 *
 * @param props - Configuration options for the editor
 * @returns Editor instance, submit handler, markdown content, and paste modal
 */

const useTipTapEditor = ({
    onSubmitCallback,
    content,
    isGenerating,
    isProcessingAttachment,
    isAutocompleteActive,
    isAutocompleteActiveRef: externalRef,
    onFocus,
    onBlur,
    onPasteLargeContent,
}: UseTipTapEditorProps) => {
    // ===== Autocomplete Ref Management =====
    // Use external ref if provided, otherwise create internal ref
    const internalRef = React.useRef(isAutocompleteActive ?? false);
    const isAutocompleteActiveRef = externalRef || internalRef;

    // Update internal ref if external ref not provided
    React.useEffect(() => {
        if (!externalRef && isAutocompleteActive !== undefined) {
            isAutocompleteActiveRef.current = isAutocompleteActive;
        }
    }, [isAutocompleteActive, externalRef, isAutocompleteActiveRef]);

    const editorRef = React.useRef<Editor | null>(null);

    // Handle paste interception for code detection
    const { handlePasteCode, pasteCodeModal } = usePasteCodeInterception({ editorRef });

    // ===== Editor Configuration =====
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: c('collider_2025:Placeholder').t`Ask anything…`,
            }),
            PasteInterceptExtension.configure({
                onInterceptPaste: handlePasteCode,
            }),
        ],
        editorProps: {
            attributes: EDITOR_ATTRIBUTES,
            handleDOMEvents: {
                keydown: (view, e): boolean | undefined => {
                    // Skip if generating or processing attachment
                    if (isGenerating || isProcessingAttachment) {
                        return;
                    }

                    const isEnter = e.key === 'Enter';

                    // If autocomplete is active and Enter is pressed, don't handle it
                    // The autocomplete handler (attached in capture phase) will handle it
                    if (isAutocompleteActiveRef.current && isEnter) {
                        return false;
                    }

                    // Mobile behavior: Enter creates single line break, no submit on keyboard
                    if (isMobile()) {
                        if (isEnter) {
                            return handleMobileEnterKey(e, editorRef.current);
                        }
                        return undefined;
                    }

                    // Desktop behavior
                    if (!isEnter) {
                        return undefined;
                    }

                    const { state } = view;
                    const { $from } = state.selection;
                    const nodeType = $from.parent.type.name;
                    const isInListNode = isInList(view, editorRef.current);

                    if (e.shiftKey) {
                        // Shift+Enter: Exit blocks/lists or create line break
                        return handleDesktopShiftEnter(view, e, editorRef.current, nodeType, isInListNode);
                    } else {
                        // Enter: Exit blocks, allow list behavior, or submit
                        return handleDesktopEnter(view, e, editorRef.current, nodeType, isInListNode, onSubmitCallback);
                    }
                },
                paste: (view, event) => {
                    if (!onPasteLargeContent) {
                        return false;
                    }

                    const pastedText = event.clipboardData?.getData('text/plain');

                    if (!pastedText) {
                        return false;
                    }

                    // Check for large content first
                    if (shouldConvertPasteToAttachment(pastedText)) {
                        event.preventDefault();
                        onPasteLargeContent(pastedText);
                        return true;
                    }

                    // Let the PasteInterceptExtension handle code detection
                    return false;
                },
            },
        },
        content: content || '',
        autofocus: true,
        onFocus: ({ editor }) => {
            editor.commands.focus();
            onFocus?.();
        },
        onBlur: () => {
            onBlur?.();
        },
    });

    // Update the editor ref whenever editor changes
    React.useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    // Update placeholder text when processing state changes
    const prevProcessingRef = React.useRef(isProcessingAttachment);

    React.useEffect(() => {
        if (editor && prevProcessingRef.current !== isProcessingAttachment) {
            prevProcessingRef.current = isProcessingAttachment;

            const placeholder = isProcessingAttachment
                ? c('collider_2025:Placeholder').t`Processing files, please wait...`
                : c('collider_2025:Placeholder').t`Ask anything…`;

            // Update the extension configuration directly without dispatching
            const placeholderExt = editor.extensionManager.extensions.find((ext: any) => ext.name === 'placeholder');
            if (placeholderExt) {
                placeholderExt.options.placeholder = placeholder;
                // Only force update if the editor is not currently focused (to avoid interrupting typing)
                if (!editor.isFocused) {
                    editor.view.dispatch(editor.state.tr);
                }
            }
        }
    }, [editor, isProcessingAttachment]);

    // ===== Submit Handler =====
    const handleSubmit = React.useCallback(() => {
        if (isProcessingAttachment) {
            return;
        }
        onSubmitCallback(editor);
    }, [isProcessingAttachment, onSubmitCallback, editor]);

    // ===== Markdown Conversion =====
    // Convert editor HTML content to markdown for submission
    const editorContentMarkdown = React.useMemo(() => {
        if (!editor) {
            return '';
        }
        const html = editor.getHTML();
        return htmlToMarkdown(html);
    }, [editor?.state.doc]);

    // ===== Return Values =====
    return {
        editor,
        handleSubmit,
        editorContentMarkdown,
        pasteCodeModal,
    };
};

export default useTipTapEditor;
