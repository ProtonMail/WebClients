import { useEffect } from 'react';

import { EditorContent } from '@tiptap/react';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { useTierErrors } from '../../../../../hooks/useTierErrors';
import useTipTapEditor from '../../../../../hooks/useTipTapEditor';

interface MessageEditorProps {
    messageContent: string;
    handleEditMessage: (newContent: string) => void;
    handleCancel: () => void;
}

const MessageEditor = ({ messageContent, handleEditMessage, handleCancel }: MessageEditorProps) => {
    const { hasTierErrors } = useTierErrors();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleCancel();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleCancel]);

    const sendEditSubmit = (editor: any) => {
        const currentMarkdownContent = editor?.storage.markdown.getMarkdown();
        if (currentMarkdownContent !== messageContent) {
            if (!editor?.isEmpty) {
                editor?.commands.clearContent();
                handleEditMessage(currentMarkdownContent);
            }
        }
    };

    const { editor, handleSubmit, editorContentMarkdown } = useTipTapEditor({
        content: messageContent,
        onSubmitCallback: sendEditSubmit,
        hasTierErrors,
    });

    return (
        <div className="flex flex-column w-full gap-2">
            <EditorContent
                editor={editor}
                className="input p-2 max-h-custom overflow-y-auto"
                style={{ '--max-h-custom': '210px' }}
            />
            <div className="flex flex-column flex-nowrap gap-2">
                <div className="flex flex-nowrap gap-3 self-end">
                    <Button className="shrink-0" shape="outline" color="weak" onClick={handleCancel}>
                        {c('collider_2025:Button').t`Cancel`}
                    </Button>
                    <Button
                        className="shrink-0"
                        shape="solid"
                        color="norm"
                        onClick={handleSubmit}
                        disabled={messageContent === editorContentMarkdown || hasTierErrors}
                    >
                        {c('collider_2025:Button').t`Send`}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MessageEditor;
