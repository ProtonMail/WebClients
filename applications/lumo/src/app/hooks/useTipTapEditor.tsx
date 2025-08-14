import React from 'react';

import Placeholder from '@tiptap/extension-placeholder';
import type { Editor } from '@tiptap/react';
import { useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Markdown as TipTapMarkdown } from 'tiptap-markdown';
import { c } from 'ttag';

interface UseTipTapEditorProps {
    onSubmitCallback: (editor: Editor | null) => void;
    content?: string;
    hasTierErrors?: boolean;
    isGenerating?: boolean;
    isProcessingAttachment?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
}

const useTipTapEditor = ({
    onSubmitCallback,
    content,
    hasTierErrors,
    isGenerating,
    isProcessingAttachment,
    onFocus,
    onBlur,
}: UseTipTapEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: c('collider_2025:Placeholder').t`Ask anything…`,
            }),
            TipTapMarkdown.configure({
                html: true,
                transformPastedText: true,
                transformCopiedText: true,
            }),
        ],
        editorProps: {
            attributes: {
                class: 'composer flex-grow w-full resize-none markdown-rendering',
                contenteditable: 'true',
                autocorrect: 'on',
                autocomplete: 'on',
                autocapitalize: 'sentences',
                spellcheck: 'true',
            },
            handleDOMEvents: {
                keydown: (view, e) => {
                    const isEnter = e.key === 'Enter' && !e.shiftKey;
                    if (!isEnter || isGenerating || isProcessingAttachment) {
                        return;
                    }

                    onSubmitCallback(editor);
                    e.preventDefault();
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

    // Only update placeholder when processing state changes to avoid frequent re-renders
    // Use a ref to track previous state and avoid unnecessary updates
    const prevProcessingRef = React.useRef(isProcessingAttachment);

    React.useEffect(() => {
        if (editor && prevProcessingRef.current !== isProcessingAttachment) {
            prevProcessingRef.current = isProcessingAttachment;

            // Use a more performant way to update placeholder
            const placeholder = isProcessingAttachment
                ? c('collider_2025:Placeholder').t`Processing files, please wait...`
                : c('collider_2025:Placeholder').t`Ask anything…`;

            // Update the extension configuration directly without dispatching
            const placeholderExt = editor.extensionManager.extensions.find((ext) => ext.name === 'placeholder');
            if (placeholderExt) {
                placeholderExt.options.placeholder = placeholder;
                // Only force update if the editor is not currently focused (to avoid interrupting typing)
                if (!editor.isFocused) {
                    editor.view.dispatch(editor.state.tr);
                }
            }
        }
    }, [editor, isProcessingAttachment]);

    const handleSubmit = () => {
        // Additional check before submission
        if (isProcessingAttachment) {
            return;
        }
        onSubmitCallback(editor);
    };

    const editorContentMarkdown = editor?.storage.markdown.getMarkdown();

    return { editor, handleSubmit, editorContentMarkdown };
};

export default useTipTapEditor;
