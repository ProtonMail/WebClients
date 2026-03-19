import { useCallback, useRef } from 'react';

import type { Editor } from '@tiptap/react';

import { useModalState } from '@proton/components';

import { PasteCodeModal } from '../ui/components/PasteCodeModal/PasteCodeModal';

interface UsePasteCodeInterceptionProps {
    editorRef: React.MutableRefObject<Editor | null>;
}

/**
 * Custom hook for handling paste interception when code is detected.
 * This is used to prevent possible content transformation for code-like content when handled by default paste behavior in tiptap editor.
 * Manages modal state and provides handlers for pasting content as code or plaintext.
 *
 * @param editorRef - Reference to the TipTap editor instance
 * @returns Object containing paste handler, modal component, and modal state
 */
export const usePasteCodeInterception = ({ editorRef }: UsePasteCodeInterceptionProps) => {
    // Refs to store intercepted paste data
    const pasteTextRef = useRef<string | null>(null);
    const pasteHtmlRef = useRef<string | null>(null);

    // Modal state using Proton's useModalState
    const [pasteCodeModalProps, setPasteCodeModalOpen] = useModalState();

    /**
     * Clears paste refs and closes the modal
     */
    const clearPasteRefsAndCloseModal = useCallback(() => {
        pasteTextRef.current = null;
        pasteHtmlRef.current = null;
        setPasteCodeModalOpen(false);
    }, [setPasteCodeModalOpen]);

    /**
     * Inserts content as a code block in the editor
     */
    const insertAsCodeBlock = useCallback((editor: Editor, text: string) => {
        editor
            .chain()
            .focus()
            .insertContent({
                type: 'codeBlock',
                content: [
                    {
                        type: 'text',
                        text: text,
                    },
                ],
            })
            .run();
    }, []);

    /**
     * Callback for when code is detected - stores paste data and shows modal
     */
    const handlePasteCode = useCallback(
        (text: string, html?: string) => {
            // Store the pasted text and html in refs
            pasteTextRef.current = text;
            pasteHtmlRef.current = html || null;

            // Show the modal to ask user
            setPasteCodeModalOpen(true);
        },
        [setPasteCodeModalOpen]
    );

    /**
     * Handler for pasting as code block to preserve code content
     */
    const handlePasteAsCode = useCallback(() => {
        const text = pasteTextRef.current;
        const currentEditor = editorRef.current;

        if (!text || !currentEditor) {
            return;
        }

        insertAsCodeBlock(currentEditor, text);
        clearPasteRefsAndCloseModal();
    }, [editorRef, insertAsCodeBlock, clearPasteRefsAndCloseModal]);

    /**
     * Handler to paste as plaintext
     */
    const handlePasteNormal = useCallback(() => {
        const text = pasteTextRef.current;
        const currentEditor = editorRef.current;

        if (!text || !currentEditor) {
            return;
        }

        currentEditor.chain().focus().insertContent(text).run();
        clearPasteRefsAndCloseModal();
    }, [editorRef, clearPasteRefsAndCloseModal]);

    /**
     * Handle modal close - clean up refs
     */
    const handleModalClose = useCallback(() => {
        pasteTextRef.current = null;
        pasteHtmlRef.current = null;
    }, []);

    // Render paste code modal if open
    const pasteCodeModal = pasteCodeModalProps.open ? (
        <PasteCodeModal
            {...pasteCodeModalProps}
            onPasteAsCode={handlePasteAsCode}
            onPasteNormal={handlePasteNormal}
            onClose={handleModalClose}
        />
    ) : null;

    return {
        handlePasteCode,
        pasteCodeModal,
        pasteCodeModalProps,
    };
};
