import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { noop } from '@proton/shared/lib/helpers/function';
import { KeyboardKey, MailSettings } from '@proton/shared/lib/interfaces';
import { useFolders, useHotkeys, useMailSettings, HotkeyTuple, useEventManager } from '@proton/components';
import { isStarred } from '../../helpers/elements';
import { getFolderName } from '../../helpers/labels';
import { Element } from '../../models/element';
import { useMoveToFolder, useStar } from '../useApplyLabels';
import { MARK_AS_STATUS, useMarkAs } from '../useMarkAs';
import { useFolderNavigationHotkeys } from '../mailbox/useFolderNavigationHotkeys';
import { useOnCompose } from '../../containers/ComposeProvider';
import { MESSAGE_ACTIONS } from '../../constants';
import { isConversationMode } from '../../helpers/mailSettings';
import { MessageState } from '../../logic/messages/messagesTypes';

const { TRASH, SPAM, ARCHIVE, INBOX } = MAILBOX_LABEL_IDS;

enum ARROW_SCROLL_DIRECTIONS {
    UP,
    DOWN,
}

export interface MessageHotkeysContext {
    labelID: string;
    conversationIndex: number;
    message: MessageState;
    messageLoaded: boolean;
    bodyLoaded: boolean;
    expanded: boolean;
    draft: boolean;
    conversationMode: boolean;
    mailSettings: MailSettings;
    messageRef: React.RefObject<HTMLElement>;
}

export interface MessageHotkeysHandlers {
    onFocus: (index: number) => void;
    setExpanded: (expanded: boolean) => void;
    toggleOriginalMessage: () => void;
    handleLoadRemoteImages: () => void;
    handleLoadEmbeddedImages: () => void;
    onBack: () => void;
}

export const useMessageHotkeys = (
    elementRef: React.RefObject<HTMLElement | undefined>,
    {
        labelID,
        conversationIndex,
        message,
        bodyLoaded,
        expanded,
        messageLoaded,
        draft,
        conversationMode,
        mailSettings,
        messageRef,
    }: MessageHotkeysContext,
    {
        onFocus,
        setExpanded,
        toggleOriginalMessage,
        handleLoadRemoteImages,
        handleLoadEmbeddedImages,
        onBack,
    }: MessageHotkeysHandlers
) => {
    const location = useLocation();
    const [{ Shortcuts = 0 } = {}] = useMailSettings();
    const [folders] = useFolders();
    const folderNavigationHotkeys = useFolderNavigationHotkeys();
    const { call } = useEventManager();

    const labelDropdownToggleRef = useRef<() => void>(noop);
    const moveDropdownToggleRef = useRef<() => void>(noop);
    const filterDropdownToggleRef = useRef<() => void>(noop);

    const markAs = useMarkAs();
    const moveToFolder = useMoveToFolder();
    const star = useStar();

    const [hasFocus, setHasFocus] = useState(false);

    const onCompose = useOnCompose();

    const handleFocus = () => {
        setHasFocus(true);
        onFocus(conversationIndex);
    };

    const handleBlur = () => {
        setHasFocus(false);
    };

    const isMessageReady = messageLoaded && bodyLoaded;
    const hotkeysEnabledAndMessageReady =
        Shortcuts && isMessageReady && expanded && message.messageDocument?.initialized;

    const isScheduledMessage = message.data?.LabelIDs?.includes(MAILBOX_LABEL_IDS.SCHEDULED);

    const moveElementTo = async (e: KeyboardEvent, LabelID: MAILBOX_LABEL_IDS) => {
        if (!message.data) {
            return;
        }

        const folderName = getFolderName(LabelID, folders);
        const fromLabelID = message.data.LabelIDs?.includes(labelID) ? INBOX : labelID;

        await moveToFolder([message.data], LabelID, folderName, fromLabelID);
    };

    const shouldStopPropagation = (e: KeyboardEvent, direction: ARROW_SCROLL_DIRECTIONS) => {
        const { bottom: topLimit } =
            document.querySelector('[data-shortcut-target="message-conversation-summary"]')?.getBoundingClientRect() ||
            {};
        const bottomLimit = window.innerHeight;

        const { top: elementTop, bottom: elementBottom } = elementRef?.current?.getBoundingClientRect() || {};

        if (!elementTop || !elementBottom || !topLimit) {
            return;
        }

        const THRESHOLD = 28;

        const distanceFromTop = elementTop - topLimit;
        const distanceFromBottom = bottomLimit - elementBottom;

        if (direction === ARROW_SCROLL_DIRECTIONS.UP && distanceFromTop < THRESHOLD) {
            e.stopPropagation();
        }

        if (direction === ARROW_SCROLL_DIRECTIONS.DOWN && distanceFromBottom < THRESHOLD) {
            e.stopPropagation();
        }
    };

    const shortcutHandlers: HotkeyTuple[] = [
        ...folderNavigationHotkeys,
        [
            'Enter',
            (e) => {
                if (draft) {
                    e.stopPropagation();
                    e.preventDefault();
                    onCompose({ existingDraft: message, fromUndo: false });
                }
            },
        ],
        [
            'ArrowUp',
            (e) => {
                shouldStopPropagation(e, ARROW_SCROLL_DIRECTIONS.UP);
            },
        ],
        [
            'ArrowDown',
            (e) => {
                shouldStopPropagation(e, ARROW_SCROLL_DIRECTIONS.DOWN);
            },
        ],
        [
            'Escape',
            (e) => {
                if (isMessageReady && expanded && conversationMode) {
                    e.stopPropagation();
                    setExpanded(false);
                }
            },
        ],
        [
            'O',
            () => {
                if (Shortcuts && isMessageReady && expanded) {
                    toggleOriginalMessage();
                }
            },
        ],
        [
            'R',
            (e) => {
                if (hotkeysEnabledAndMessageReady && !isScheduledMessage) {
                    e.preventDefault();
                    e.stopPropagation();
                    onCompose({
                        action: MESSAGE_ACTIONS.REPLY,
                        referenceMessage: message,
                    });
                }
            },
        ],
        [
            ['Shift', 'R'],
            (e) => {
                if (hotkeysEnabledAndMessageReady && !isScheduledMessage) {
                    e.preventDefault();
                    e.stopPropagation();
                    onCompose({
                        action: MESSAGE_ACTIONS.REPLY_ALL,
                        referenceMessage: message,
                    });
                }
            },
        ],
        [
            ['Shift', 'F'],
            (e) => {
                if (hotkeysEnabledAndMessageReady && !isScheduledMessage) {
                    e.preventDefault();
                    e.stopPropagation();
                    onCompose({
                        action: MESSAGE_ACTIONS.FORWARD,
                        referenceMessage: message,
                    });
                }
            },
        ],
        [
            ['Shift', 'C'],
            async (e) => {
                if (hotkeysEnabledAndMessageReady) {
                    e.stopPropagation();
                    await handleLoadRemoteImages();
                }
            },
        ],
        [
            ['Shift', 'E'],
            async (e) => {
                if (hotkeysEnabledAndMessageReady) {
                    e.stopPropagation();
                    await handleLoadEmbeddedImages();
                }
            },
        ],
        [
            'U',
            async (e) => {
                if (hotkeysEnabledAndMessageReady) {
                    e.stopPropagation();
                    setExpanded(false);
                    if (isConversationMode(labelID, mailSettings, location)) {
                        messageRef.current?.focus();
                    } else {
                        onBack();
                    }
                    markAs([message.data as Element], labelID, MARK_AS_STATUS.UNREAD);
                    await call();
                }
            },
        ],
        [
            KeyboardKey.Star,
            async (e) => {
                if (hotkeysEnabledAndMessageReady && message.data) {
                    e.stopPropagation();
                    await star([message.data as Element], !isStarred(message.data));
                }
            },
        ],
        [
            'I',
            async (e) => {
                if (hotkeysEnabledAndMessageReady) {
                    e.stopPropagation();
                    await moveElementTo(e, INBOX);
                }
            },
        ],
        [
            'A',
            async (e) => {
                if (hotkeysEnabledAndMessageReady) {
                    e.stopPropagation();
                    await moveElementTo(e, ARCHIVE);
                }
            },
        ],
        [
            'S',
            async (e) => {
                if (hotkeysEnabledAndMessageReady) {
                    e.stopPropagation();
                    await moveElementTo(e, SPAM);
                }
            },
        ],
        [
            'T',
            async (e) => {
                if (hotkeysEnabledAndMessageReady) {
                    e.stopPropagation();
                    await moveElementTo(e, TRASH);
                }
            },
        ],
        [
            'L',
            (e) => {
                if (hotkeysEnabledAndMessageReady) {
                    e.stopPropagation();
                    e.preventDefault();
                    labelDropdownToggleRef.current?.();
                }
            },
        ],
        [
            'M',
            (e) => {
                if (hotkeysEnabledAndMessageReady) {
                    e.stopPropagation();
                    e.preventDefault();
                    moveDropdownToggleRef.current?.();
                }
            },
        ],
        [
            'F',
            (e) => {
                if (hotkeysEnabledAndMessageReady) {
                    e.stopPropagation();
                    filterDropdownToggleRef.current?.();
                }
            },
        ],
    ];

    useHotkeys(elementRef, shortcutHandlers, {
        dependencies: [hasFocus],
    });

    return {
        hasFocus,
        handleFocus,
        handleBlur,
        labelDropdownToggleRef,
        moveDropdownToggleRef,
        filterDropdownToggleRef,
    };
};
