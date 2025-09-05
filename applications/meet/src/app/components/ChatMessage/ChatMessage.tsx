import { useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import { useHotkeys } from '@proton/components/hooks/useHotkeys';
import { IcMeetSend } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import { trimMessage } from '../../utils/trim-message';

import './ChatMessage.scss';

interface ChatMessageProps {
    onMessageSend: (message: string) => void;
}

export const ChatMessage = ({ onMessageSend }: ChatMessageProps) => {
    const [message, setMessage] = useState('');

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const textareaHeight = useMemo(() => {
        if (textareaRef.current) {
            const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
            const minHeight = rootFontSize * 2.25; // 2.25rem in px
            const maxHeight = rootFontSize * 6; // 6rem in px

            const scrollHeight = textareaRef.current.scrollHeight;
            const newHeight =
                message.trim() === '' ? minHeight : Math.max(minHeight, Math.min(scrollHeight, maxHeight));
            return `${newHeight / rootFontSize}rem`;
        }
        return '2.25rem'; // default height
    }, [message]);

    useHotkeys(
        textareaRef,
        [
            [
                'Enter',
                (e) => {
                    if (!e.shiftKey && message.trim() !== '') {
                        e.preventDefault();
                        onMessageSend(message);
                        setMessage('');
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
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={c('Placeholder').t`Type an encrypted message...`}
                    unstyled={true}
                    className={clsx('border-none resize-none px-0 my-auto', 'hide-scrollbar')}
                    style={{
                        minHeight: '2.25rem',
                        maxHeight: '6rem',
                        height: textareaHeight,
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
                        setMessage('');
                    }}
                    style={{
                        '--w-custom': '2.25rem',
                        '--h-custom': '2.25rem',
                    }}
                    aria-label={c('Alt').t`Send an encrypted message`}
                    disabled={!trimMessage(message)}
                >
                    <IcMeetSend size={5} className="color-invert" />
                </Button>
            </div>
        </div>
    );
};
