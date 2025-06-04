import { useLayoutEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { InputFieldTwo, TextAreaTwo, useHotkeys } from '@proton/components';
import { IcArrowUp } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import './ChatMessage.scss';

interface ChatMessageProps {
    message: string;
    onMessageChange: (message: string) => void;
    onMessageSend: (message: string) => void;
}

export const ChatMessage = ({ message, onMessageChange, onMessageSend }: ChatMessageProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        if (textareaRef.current) {
            const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

            const minHeight = rootFontSize * 2.25; // 2.25rem in px
            const maxHeight = rootFontSize * 6; // 6rem in px

            const scrollHeight = textareaRef.current.scrollHeight;
            const newHeight =
                message.trim() === '' ? minHeight : Math.max(minHeight, Math.min(scrollHeight, maxHeight));
            textareaRef.current.style.height = `${newHeight / rootFontSize}rem`;
        }
    }, [message]);

    useHotkeys(
        textareaRef,
        [
            [
                'Enter',
                (e) => {
                    if (!e.shiftKey) {
                        e.preventDefault();
                        onMessageSend(message);
                        onMessageChange('');
                        textareaRef.current?.focus();
                    }
                },
            ],
        ],
        {
            keyEventType: 'keydown',
        }
    );

    return (
        <div className="w-full relative">
            <div
                className="w-custom border-top border-top-strong absolute top-0 left-custom"
                style={{ '--left-custom': '-1rem', '--w-custom': 'calc(100% + 2rem)' }}
            />
            <div className="flex flex-nowrap items-start gap-4 w-full px-2 pt-4">
                <InputFieldTwo
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => onMessageChange(e.target.value)}
                    placeholder={c('Meet').t`Type a message...`}
                    unstyled={true}
                    className={clsx('border-none resize-none relative top-custom px-0', 'hide-scrollbar')}
                    style={{
                        minHeight: '2.25rem',
                        maxHeight: '6rem',
                        '--top-custom': '-0.5rem',
                    }}
                    as={TextAreaTwo}
                    assistContainerClassName="display-none"
                    rows={1}
                />
                <Button
                    className={clsx(
                        'rounded-full border-none w-custom h-custom p-0 flex items-center justify-center color-norm shrink-0',
                        'send-message-button'
                    )}
                    onClick={() => {
                        onMessageSend(message);
                        onMessageChange('');
                    }}
                    style={{
                        '--w-custom': '2.25rem',
                        '--h-custom': '2.25rem',
                    }}
                >
                    <IcArrowUp color="norm" size={5} />
                </Button>
            </div>
        </div>
    );
};
