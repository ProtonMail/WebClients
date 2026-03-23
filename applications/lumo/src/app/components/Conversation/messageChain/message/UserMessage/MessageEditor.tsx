import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { useTierErrors } from '../../../../../hooks/useTierErrors';

interface MessageEditorProps {
    messageContent: string;
    handleEditMessage: (newContent: string) => void;
    handleCancel: () => void;
}

const MessageEditor = ({ messageContent, handleEditMessage, handleCancel }: MessageEditorProps) => {
    const { hasTierErrors } = useTierErrors();
    const [value, setValue] = useState(messageContent);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
        const len = textareaRef.current?.value.length ?? 0;
        textareaRef.current?.setSelectionRange(len, len);
    }, []);

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

    const handleSubmit = () => {
        const trimmed = value.trim();
        if (trimmed && trimmed !== messageContent) {
            handleEditMessage(trimmed);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const isUnchanged = value.trim() === messageContent.trim();

    return (
        <div className="flex flex-column w-full gap-2">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="input p-2 max-h-custom overflow-y-auto resize-none w-full"
                style={{ '--max-h-custom': '210px' }}
                rows={3}
                autoCorrect="on"
                autoComplete="off"
                spellCheck
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
                        disabled={isUnchanged || hasTierErrors}
                    >
                        {c('collider_2025:Button').t`Send`}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MessageEditor;
