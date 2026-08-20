import React, {
    type ChangeEventHandler,
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import data from '@emoji-mart/data';
import { Picker } from 'emoji-mart';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Popper } from '@proton/atoms/Popper/Popper';
import { usePopper } from '@proton/atoms/Popper/usePopper';
import useFocusTrap from '@proton/components/components/focus/useFocusTrap';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import { useHotkeys } from '@proton/components/hooks/useHotkeys';
import useCombinedRefs from '@proton/hooks/useCombinedRefs';
import useLoading from '@proton/hooks/useLoading';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcEmoji } from '@proton/icons/icons/IcEmoji';
import { IcMeetSend } from '@proton/icons/icons/IcMeetSend';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectChatThreadReplyDraft,
    selectDraftMessage,
    setChatThreadReplyDraft,
    setDraftMessage,
} from '@proton/meet/store/slices/chatAndReactionsSlice';
import {
    selectLocalParticipantIdentity,
    selectParticipantName,
} from '@proton/meet/store/slices/participants/participantsSlice';
import clsx from '@proton/utils/clsx';

import { useParticipantDisplayColors } from '../../hooks/useParticipantDisplayColors';
import { getParticipantInitials } from '../../utils/getParticipantInitials';
import { trimMessage } from '../../utils/trim-message';

import './ChatMessage.scss';

const EmojiPicker = ({
    autoFocus,
    onEmojiSelect,
    set,
    skinTonePosition,
    previewPosition,
    perLine,
}: {
    autoFocus: boolean;
    onEmojiSelect: (emoji: { native: string }) => void;
    set: string;
    skinTonePosition: string;
    previewPosition: string;
    perLine: number;
}) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        new Picker({ autoFocus, onEmojiSelect, set, skinTonePosition, previewPosition, perLine, data, ref });
    }, [autoFocus, onEmojiSelect, perLine, previewPosition, set, skinTonePosition]);

    return <div ref={ref} />;
};

// Avatar shown next to the thread reply field. Kept as a dedicated component so the default
// composer never subscribes to participant state it doesn't render.
const LocalParticipantAvatar = () => {
    const localParticipantIdentity = useMeetSelector(selectLocalParticipantIdentity);
    const participantName = useMeetSelector((state) => selectParticipantName(state, localParticipantIdentity));
    const { participantColors } = useParticipantDisplayColors(localParticipantIdentity);

    return (
        <div
            className={clsx(
                participantColors.backgroundColor,
                participantColors.profileTextColor,
                'color-invert rounded-full flex items-center justify-center shrink-0 text-sm w-custom h-custom'
            )}
            style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}
        >
            <div>{getParticipantInitials(participantName)}</div>
        </div>
    );
};

type ChatMessageVariant = 'default' | 'thread';

interface ChatMessageProps {
    onMessageSend: (message: string) => Promise<boolean>;
    /**
     * 'default' renders the full-width chat composer (with persisted draft).
     * 'thread' renders a compact reply field meant to be nested inside a thread.
     */
    variant?: ChatMessageVariant;
    autoFocus?: boolean;
    placeholder?: string;
    /**
     * Id of the thread root message whose reply draft this field is bound to. When provided (thread
     * variant), the draft is persisted on the root message and cleared once the reply is sent.
     */
    rootMessageId?: string;
    showThreadCloseButton?: boolean;
    onThreadClose?: () => void;
}

// Per-variant sizing of the textarea (in rem) and the action buttons.
const VARIANT_CONFIG: Record<ChatMessageVariant, { minHeight: number; maxHeight: number; buttonSize: string }> = {
    default: { minHeight: 2.25, maxHeight: 6, buttonSize: '2.25rem' },
    thread: { minHeight: 1.5, maxHeight: 5, buttonSize: '2.25rem' },
};

export const ChatMessage = ({
    onMessageSend,
    variant = 'default',
    autoFocus,
    placeholder,
    rootMessageId,
    showThreadCloseButton = false,
    onThreadClose,
}: ChatMessageProps) => {
    const isThread = variant === 'thread';
    const { minHeight, maxHeight, buttonSize } = VARIANT_CONFIG[variant];

    // The thread reply field focuses itself on demand, the main composer always focuses on mount.
    const resolvedAutoFocus = autoFocus ?? !isThread;

    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

    const emojiPickerId = useId();

    const [chatMessageLoading, withChatMessageLoading] = useLoading();

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const emojiAnchorRef = useRef<HTMLButtonElement>(null);
    const emojiPopperRef = useRef<HTMLDivElement>(null);

    const dispatch = useMeetDispatch();

    const { floating, position } = usePopper({
        reference: {
            mode: 'element',
            value: emojiAnchorRef.current,
        },
        isOpen: emojiPickerOpen,
        originalPlacement: 'top-end',
        availablePlacements: ['top-end', 'top', 'bottom-end', 'bottom'],
        offset: 8,
    });

    // The picker is portaled outside the side-bar's focus trap, so it needs its own trap to become
    // the active one — otherwise the side-bar trap steals focus back and defeats `autoFocus`.
    const emojiFocusTrapProps = useFocusTrap({
        rootRef: emojiPopperRef,
        active: emojiPickerOpen,
        enableInitialFocus: false,
    });

    const setEmojiPopperRef = useCombinedRefs<HTMLDivElement>(emojiPopperRef, floating);

    // Thread replies persist their draft on the root message; the main composer uses the shared draft.
    const persistThreadDraft = isThread && rootMessageId !== undefined;
    const defaultDraftMessage = useMeetSelector(selectDraftMessage);
    const threadDraftMessage = useMeetSelector((state) =>
        persistThreadDraft ? selectChatThreadReplyDraft(state, rootMessageId) : ''
    );
    const [message, setMessage] = useState(isThread ? threadDraftMessage : defaultDraftMessage);
    const currentMessage = useRef(message);

    const updateMessage = useCallback(
        (value: string) => {
            setMessage(value);
            currentMessage.current = value;
            if (persistThreadDraft) {
                dispatch(setChatThreadReplyDraft({ messageId: rootMessageId, draft: value }));
            }
        },
        [dispatch, persistThreadDraft, rootMessageId]
    );

    const handleMessageChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
        const { value } = event.target;

        updateMessage(value);
    };

    useLayoutEffect(() => {
        // Moving textarea cursor to the end of the message on initial load
        textareaRef.current?.setSelectionRange(currentMessage.current.length, currentMessage.current.length);

        if (isThread) {
            return;
        }

        return () => {
            // Preserve last message when component is unmounted
            dispatch(setDraftMessage(currentMessage.current));
        };
    }, [dispatch, isThread]);

    const textareaHeight = useMemo(() => {
        if (textareaRef.current) {
            const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
            const minHeightPx = rootFontSize * minHeight;
            const maxHeightPx = rootFontSize * maxHeight;

            const scrollHeight = textareaRef.current.scrollHeight;
            const newHeight =
                message.trim() === '' ? minHeightPx : Math.max(minHeightPx, Math.min(scrollHeight, maxHeightPx));
            return `${newHeight / rootFontSize}rem`;
        }
        return `${minHeight}rem`;
    }, [message, minHeight, maxHeight]);

    const handleChatMessageSubmit = async () => {
        const messageToSend = message;

        updateMessage('');

        const result = await onMessageSend(messageToSend);

        if (!result && currentMessage.current === '') {
            updateMessage(messageToSend);
        }

        return result;
    };

    const handleEmojiSelect = useCallback(
        (emoji: { native: string }) => {
            const textarea = textareaRef.current;
            if (textarea) {
                const start = textarea.selectionStart ?? message.length;
                const end = textarea.selectionEnd ?? message.length;
                const newMessage = message.slice(0, start) + emoji.native + message.slice(end);
                updateMessage(newMessage);
                setTimeout(() => {
                    textarea.setSelectionRange(start + emoji.native.length, start + emoji.native.length);
                    textarea.focus();
                }, 0);
            } else {
                updateMessage(message + emoji.native);
            }
            setEmojiPickerOpen(false);
        },
        [message, updateMessage]
    );

    useEffect(() => {
        if (!emojiPickerOpen) {
            return;
        }

        const handleClickOutside = ({ target }: MouseEvent) => {
            const node = target as Node | null;
            if (!node || emojiPopperRef.current?.contains(node) || emojiAnchorRef.current?.contains(node)) {
                return;
            }
            setEmojiPickerOpen(false);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                setEmojiPickerOpen(false);
                emojiAnchorRef.current?.focus();
            }
        };

        // Defer so the opening click doesn't immediately close the picker.
        const timeoutId = window.setTimeout(() => {
            document.addEventListener('click', handleClickOutside, { capture: true });
        }, 0);

        document.addEventListener('keydown', handleKeyDown, { capture: true });

        return () => {
            window.clearTimeout(timeoutId);
            document.removeEventListener('click', handleClickOutside, { capture: true });
            document.removeEventListener('keydown', handleKeyDown, { capture: true });
        };
    }, [emojiPickerOpen]);

    useHotkeys(
        textareaRef,
        [
            [
                'Enter',
                async (e) => {
                    if (!e.shiftKey && message.trim() !== '') {
                        e.preventDefault();

                        if (chatMessageLoading) {
                            return;
                        }

                        const result = await withChatMessageLoading(handleChatMessageSubmit);

                        if (!result) {
                            return;
                        }

                        textareaRef.current?.focus();
                    }
                },
            ],
        ],
        {
            keyEventType: 'keydown',
        }
    );

    const textarea = (
        <InputFieldTwo
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            placeholder={
                placeholder ??
                (isThread ? c('Placeholder').t`Reply...` : c('Placeholder').t`Type an encrypted message...`)
            }
            aria-label={isThread ? c('Label').t`Reply` : c('Label').t`Message`}
            unstyled={true}
            className={clsx('border-none resize-none px-0 my-auto', 'hide-scrollbar wrap-placeholder')}
            style={{
                minHeight: `${minHeight}rem`,
                maxHeight: `${maxHeight}rem`,
                height: textareaHeight,
                overflowY: message.trim() === '' ? 'hidden' : 'auto',
            }}
            as={TextAreaTwo}
            assistContainerClassName="display-none"
            rows={1}
            autoFocus={resolvedAutoFocus}
            autoComplete="off"
        />
    );

    const emojiButton = (
        <Button
            ref={emojiAnchorRef}
            className={clsx(
                'emoji-picker-button rounded-full w-custom h-custom p-0 flex items-center justify-center color-weak shrink-0 border'
            )}
            onClick={() => setEmojiPickerOpen((open) => !open)}
            style={{
                '--w-custom': buttonSize,
                '--h-custom': buttonSize,
            }}
            aria-label={c('Action').t`Insert emoji`}
            aria-haspopup="dialog"
            aria-expanded={emojiPickerOpen}
            aria-controls={emojiPickerOpen ? emojiPickerId : undefined}
        >
            <IcEmoji size={isThread ? 4 : 5} className="block ml-px" />
        </Button>
    );

    const sendButton = (
        <Button
            className="send-message-button rounded-full border-none w-custom h-custom p-0 flex items-center justify-center color-norm shrink-0"
            onClick={() => withChatMessageLoading(handleChatMessageSubmit)}
            style={{
                '--w-custom': buttonSize,
                '--h-custom': buttonSize,
            }}
            aria-label={isThread ? c('Action').t`Send reply` : c('Action').t`Send an encrypted message`}
            aria-busy={chatMessageLoading}
            disabled={!trimMessage(message)}
        >
            {chatMessageLoading ? (
                <CircleLoader aria-hidden="true" className="color-norm w-4 h-4" />
            ) : (
                <IcMeetSend size={isThread ? 4 : 5} className="ml-0.5 color-norm" />
            )}
        </Button>
    );

    const emojiPickerPopper = (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <Popper
            id={emojiPickerId}
            className="fixed w-fit-content h-fit-content z-up"
            divRef={setEmojiPopperRef}
            isOpen={emojiPickerOpen}
            style={position}
            role="dialog"
            aria-label={c('Label').t`Emoji picker`}
            {...emojiFocusTrapProps}
        >
            <EmojiPicker
                autoFocus={true}
                onEmojiSelect={handleEmojiSelect}
                set="native"
                skinTonePosition="none"
                previewPosition="none"
                perLine={8}
            />
        </Popper>
    );

    if (isThread) {
        return (
            <div
                className={clsx(
                    'chat-message-field chat-message-field--thread relative flex flex-nowrap items-center w-full',
                    showThreadCloseButton && onThreadClose && 'pt-6'
                )}
            >
                {showThreadCloseButton && onThreadClose && (
                    <Button
                        className="chat-message-thread-close-button absolute rounded-full flex items-center justify-center color-weak p-0 w-custom h-custom z-up"
                        shape="ghost"
                        onClick={onThreadClose}
                        aria-label={c('Action').t`Close reply composer`}
                        style={{
                            '--w-custom': '1.5rem',
                            '--h-custom': '1.5rem',
                        }}
                    >
                        <IcCross size={4} />
                    </Button>
                )}
                <div className="chat-message-thread-pill flex flex-nowrap items-center gap-2 flex-1 min-w-0 rounded-full pl-2 pr-1">
                    <LocalParticipantAvatar />
                    {textarea}
                    <div className="flex flex-nowrap items-center gap-1 shrink-0">
                        {emojiButton}
                        {sendButton}
                    </div>
                </div>

                {emojiPickerPopper}
            </div>
        );
    }

    return (
        <div className="chat-message-field w-full relative pl-4 pr-2">
            <div
                className="w-custom border-top border-top-strong absolute top-0 left-custom"
                style={{ '--left-custom': '0', '--w-custom': 'calc(100% + 2rem)' }}
            />
            <div className="flex flex-nowrap items-start gap-4 w-full px-1 pt-4">
                {textarea}
                <div className="flex flex-nowrap items-start gap-1 shrink-0 ml-1">
                    {emojiButton}
                    {sendButton}
                </div>
            </div>
            {emojiPickerPopper}
        </div>
    );
};
