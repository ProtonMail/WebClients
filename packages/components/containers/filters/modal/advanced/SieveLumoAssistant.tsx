/* eslint-disable react/no-array-index-key -- chat log is append-only and text segments are re-derived per render, so positional keys are correct here */
import type { KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcPaperPlaneHorizontal } from '@proton/icons/icons/IcPaperPlaneHorizontal';
import { IcStop } from '@proton/icons/icons/IcStop';
import { useSieveAssistant } from '@proton/llm/lib/hooks/useSieveAssistant';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';

import './SieveLumoAssistant.scss';

interface Props {
    name: string;
    sieve: string;
    onInsertSieve: (code: string) => void;
    onClose: () => void;
}

interface Segment {
    type: 'text' | 'code';
    lang?: string;
    content: string;
}

const FENCE = '```';

/**
 * Minimal parser splitting an assistant message into prose and fenced code blocks. Handles the
 * trailing unclosed fence while a code block is still streaming in (renders it as code straight
 * away). Good enough for the demo — we deliberately avoid pulling in a full markdown renderer.
 */
const parseSegments = (text: string): Segment[] => {
    const segments: Segment[] = [];
    let remaining = text;

    while (remaining.length) {
        const open = remaining.indexOf(FENCE);
        if (open === -1) {
            const trailing = remaining.trim();
            if (trailing) {
                segments.push({ type: 'text', content: trailing });
            }
            break;
        }

        const before = remaining.slice(0, open).trim();
        if (before) {
            segments.push({ type: 'text', content: before });
        }

        const afterOpen = remaining.slice(open + FENCE.length);
        const newline = afterOpen.indexOf('\n');
        const lang = (newline === -1 ? afterOpen : afterOpen.slice(0, newline)).trim();
        const rest = newline === -1 ? '' : afterOpen.slice(newline + 1);
        const close = rest.indexOf(FENCE);

        if (close === -1) {
            segments.push({ type: 'code', lang, content: rest });
            break;
        }

        segments.push({ type: 'code', lang, content: rest.slice(0, close) });
        remaining = rest.slice(close + FENCE.length);
    }

    return segments;
};

/** Renders inline `**bold**` and `code` spans; everything else is plain text. */
const renderInline = (text: string): ReactNode[] => {
    return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((token, index) => {
        if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
            return <strong key={index}>{token.slice(2, -2)}</strong>;
        }
        if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
            return <code key={index}>{token.slice(1, -1)}</code>;
        }
        return token;
    });
};

const SieveLumoAssistant = ({ name, sieve, onInsertSieve, onClose }: Props) => {
    const { messages, isGenerating, error, send, retry, stop } = useSieveAssistant();
    const { createNotification } = useNotifications();
    const [input, setInput] = useState('');
    const messagesRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const container = messagesRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleSend = () => {
        if (!input.trim() || isGenerating) {
            return;
        }
        send(input, { name, sieve });
        setInput('');
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    const handleCopy = (code: string) => {
        void navigator.clipboard.writeText(code);
        createNotification({ text: c('Notification').t`Copied to clipboard` });
    };

    const title = c('Title').t`Help from ${LUMO_SHORT_APP_NAME}`;

    return (
        <div className="sieve-lumo flex flex-column flex-nowrap border border-weak rounded-lg overflow-hidden">
            <div className="sieve-lumo-header flex flex-row flex-nowrap items-center gap-2 px-3 py-2 border-bottom border-weak shrink-0">
                <span className="sieve-lumo-avatar flex items-center justify-center rounded-full bg-weak shrink-0 ratio-square">
                    <img src={lumoCatIcon} alt="" aria-hidden="true" className="sieve-lumo-avatar-icon" />
                </span>
                <span className="text-semibold flex-1">{title}</span>
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    onClick={onClose}
                    title={c('Action').t`Hide ${LUMO_SHORT_APP_NAME}`}
                >
                    <IcCross alt={c('Action').t`Hide ${LUMO_SHORT_APP_NAME}`} />
                </Button>
            </div>

            <div
                ref={messagesRef}
                className="sieve-lumo-messages flex-1 overflow-auto px-3 py-3 flex flex-column flex-nowrap gap-3"
            >
                <div className="sieve-lumo-message sieve-lumo-message--assistant">
                    {
                        // translator: greeting shown when the Lumo Sieve helper panel opens
                        c('Info')
                            .t`Hi! Describe the filter you want and I'll write the Sieve script. I can also tweak whatever is already in the editor.`
                    }
                </div>

                {messages.map((message, index) => {
                    if (message.role === 'user') {
                        return (
                            <div key={index} className="sieve-lumo-message sieve-lumo-message--user">
                                {message.content}
                            </div>
                        );
                    }

                    const isStreamingThis = isGenerating && index === messages.length - 1;
                    if (!message.content && isStreamingThis) {
                        return (
                            <div key={index} className="sieve-lumo-message sieve-lumo-message--assistant color-weak">
                                {c('Info').t`Thinking…`}
                            </div>
                        );
                    }

                    return (
                        <div key={index} className="sieve-lumo-message sieve-lumo-message--assistant">
                            {parseSegments(message.content).map((segment, segmentIndex) => {
                                if (segment.type === 'text') {
                                    return (
                                        <div key={segmentIndex} className="sieve-lumo-text">
                                            {renderInline(segment.content)}
                                        </div>
                                    );
                                }
                                return (
                                    <div
                                        key={segmentIndex}
                                        className="sieve-lumo-code border border-weak rounded mt-2 mb-2"
                                    >
                                        <pre className="m-0 p-2 overflow-auto text-sm">
                                            <code>{segment.content}</code>
                                        </pre>
                                        <div className="sieve-lumo-code-actions flex flex-row flex-nowrap gap-2 p-2 border-top border-weak">
                                            {segment.lang === 'sieve' && (
                                                <Button
                                                    size="small"
                                                    color="norm"
                                                    onClick={() => onInsertSieve(segment.content.trimEnd())}
                                                >{c('Action').t`Insert`}</Button>
                                            )}
                                            <Button
                                                size="small"
                                                shape="outline"
                                                onClick={() => handleCopy(segment.content.trimEnd())}
                                            >{c('Action').t`Copy`}</Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}

                {error && (
                    <div className="sieve-lumo-error flex flex-row flex-nowrap items-center gap-2 color-danger">
                        <span className="flex-1">{c('Error').t`Something went wrong. Please try again.`}</span>
                        <Button size="small" shape="outline" onClick={retry}>{c('Action').t`Retry`}</Button>
                    </div>
                )}
            </div>

            <div className="sieve-lumo-input flex flex-row flex-nowrap items-end gap-2 p-2 border-top border-weak shrink-0">
                <TextAreaTwo
                    ref={textareaRef}
                    className="sieve-lumo-textarea flex-1"
                    autoGrow
                    minRows={1}
                    rows={5}
                    value={input}
                    onValue={setInput}
                    onKeyDown={handleKeyDown}
                    placeholder={c('Placeholder').t`Describe the filter you want…`}
                />
                {isGenerating ? (
                    <Button icon color="norm" onClick={stop} title={c('Action').t`Stop`}>
                        <IcStop alt={c('Action').t`Stop`} />
                    </Button>
                ) : (
                    <Button icon color="norm" disabled={!input.trim()} onClick={handleSend} title={c('Action').t`Send`}>
                        <IcPaperPlaneHorizontal alt={c('Action').t`Send`} />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default SieveLumoAssistant;
