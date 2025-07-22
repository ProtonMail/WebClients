import type { RefObject } from 'react';
import { useRef } from 'react';
import { useLocation } from 'react-router-dom';

import type { HotkeyTuple } from '@proton/components';
import { useEventManager, useHotkeys } from '@proton/components';
import { useFolders } from '@proton/mail';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { isVisibleOnScreen } from '@proton/shared/lib/helpers/dom';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import noop from '@proton/utils/noop';

import { SOURCE_ACTION } from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import {
    MESSAGE_FILTER_DROPDOWN_ID,
    MESSAGE_FOLDER_DROPDOWN_ID,
    MESSAGE_LABEL_DROPDOWN_ID,
} from 'proton-mail/components/message/extrasHeader/constants';
import useMailModel from 'proton-mail/hooks/useMailModel';

import { useOnCompose } from '../../containers/ComposeProvider';
import { isStarred } from '../../helpers/elements';
import { getFolderName } from '../../helpers/labels';
import { isConversationMode } from '../../helpers/mailSettings';
import type { Element } from '../../models/element';
import { useApplyLocation } from '../actions/applyLocation/useApplyLocation';
import { useMarkAs } from '../actions/markAs/useMarkAs';
import { useMoveToFolder } from '../actions/move/useMoveToFolder';
import { useStar } from '../actions/useStar';
import { ComposeTypes } from '../composer/useCompose';

const { TRASH, SPAM, ARCHIVE, INBOX } = MAILBOX_LABEL_IDS;

enum ARROW_SCROLL_DIRECTIONS {
    UP,
    DOWN,
}

interface MessageHotkeysContext {
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

interface MessageHotkeysHandlers {
    hasFocus: boolean;
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
        hasFocus,
        setExpanded,
        toggleOriginalMessage,
        handleLoadRemoteImages,
        handleLoadEmbeddedImages,
        onBack,
    }: MessageHotkeysHandlers
) => {
    const location = useLocation();
    const { Shortcuts } = useMailModel('MailSettings');
    const [folders] = useFolders();
    const { call } = useEventManager();
    const labelDropdownToggleRef = useRef<() => void>(noop);
    const moveDropdownToggleRef = useRef<() => void>(noop);
    const filterDropdownToggleRef = useRef<() => void>(noop);

    const { markAs } = useMarkAs();
    const { enabled: applyLocationEnabled, applyLocation } = useApplyLocation();
    const { moveToFolder, moveScheduledModal, moveSnoozedModal, moveToSpamModal } = useMoveToFolder();
    const star = useStar();

    const onCompose = useOnCompose();

    const isMessageReady = messageLoaded && bodyLoaded;
    const hotkeysEnabledAndMessageReady =
        Shortcuts && isMessageReady && expanded && message.messageDocument?.initialized;

    const isScheduledMessage = message.data?.LabelIDs?.includes(MAILBOX_LABEL_IDS.SCHEDULED);

    const moveElementTo = async (e: KeyboardEvent, LabelID: MAILBOX_LABEL_IDS) => {
        if (!message.data) {
            return;
        }

        const folderName = getFolderName(LabelID, folders);

        if (applyLocationEnabled) {
            await applyLocation({
                elements: [message.data],
                targetLabelID: LabelID,
            });
        } else {
            await moveToFolder({
                elements: [message.data],
                sourceLabelID: labelID,
                destinationLabelID: LabelID,
                folderName,
                sourceAction: SOURCE_ACTION.SHORTCUTS,
            });
        }
    };

    const shouldStopPropagation = (e: KeyboardEvent, direction: ARROW_SCROLL_DIRECTIONS) => {
        const dataShortcutTarget = 'mailbox-toolbar';
        const { bottom: topLimit } =
            document.querySelector(`[data-shortcut-target="${dataShortcutTarget}"]`)?.getBoundingClientRect() || {};
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

    const openMessageToolbarDropdown = (
        toolbarDropdownButtonRef: RefObject<() => void>,
        keyboardEvent: KeyboardEvent,
        shouldScrollIntoView = false
    ) => {
        if (hotkeysEnabledAndMessageReady) {
            keyboardEvent.stopPropagation();
            keyboardEvent.preventDefault();

            if (shouldScrollIntoView) {
                messageRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
            }

            // FF has an issue when we propagate custom events
            // adding a timeout there ensure event is done when
            // other components are rendered
            setTimeout(() => {
                toolbarDropdownButtonRef.current?.();
            }, 0);
        }
    };

    const shortcutHandlers: HotkeyTuple[] = [
        [
            'Enter',
            (e) => {
                if (draft) {
                    e.stopPropagation();
                    e.preventDefault();
                    void onCompose({ type: ComposeTypes.existingDraft, existingDraft: message, fromUndo: false });
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
                    void onCompose({
                        type: ComposeTypes.newMessage,
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
                    void onCompose({
                        type: ComposeTypes.newMessage,
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
                    void onCompose({
                        type: ComposeTypes.newMessage,
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
                    handleLoadRemoteImages();
                }
            },
        ],
        [
            ['Shift', 'E'],
            async (e) => {
                if (hotkeysEnabledAndMessageReady) {
                    e.stopPropagation();
                    handleLoadEmbeddedImages();
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
                    void markAs({
                        elements: [message.data as Element],
                        labelID,
                        status: MARK_AS_STATUS.UNREAD,
                        sourceAction: SOURCE_ACTION.SHORTCUTS,
                        silent: true,
                    });
                    await call();
                }
            },
        ],
        [
            KeyboardKey.Star,
            async (e) => {
                if (hotkeysEnabledAndMessageReady && message.data) {
                    e.stopPropagation();

                    if (applyLocationEnabled) {
                        await applyLocation({
                            elements: [message.data as Element],
                            targetLabelID: MAILBOX_LABEL_IDS.STARRED,
                            removeLabel: isStarred(message.data),
                            showSuccessNotification: false,
                        });
                    } else {
                        await star(
                            [message.data as Element],
                            !isStarred(message.data),
                            labelID,
                            SOURCE_ACTION.SHORTCUTS
                        );
                    }
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
                const isVisibleElement = isVisibleOnScreen(document.getElementById(MESSAGE_LABEL_DROPDOWN_ID));
                console.log('L', isVisibleElement);

                openMessageToolbarDropdown(labelDropdownToggleRef, e, !isVisibleElement);
            },
        ],
        [
            'M',
            (e) => {
                const isVisibleElement = isVisibleOnScreen(document.getElementById(MESSAGE_FOLDER_DROPDOWN_ID));
                openMessageToolbarDropdown(moveDropdownToggleRef, e, !isVisibleElement);
            },
        ],
        [
            'F',
            (e) => {
                const isVisibleElement = isVisibleOnScreen(document.getElementById(MESSAGE_FILTER_DROPDOWN_ID));
                openMessageToolbarDropdown(filterDropdownToggleRef, e, !isVisibleElement);
            },
        ],
    ];

    useHotkeys(elementRef, shortcutHandlers, {
        dependencies: [hasFocus],
    });

    return {
        labelDropdownToggleRef,
        moveDropdownToggleRef,
        filterDropdownToggleRef,
        moveScheduledModal,
        moveSnoozedModal,
        moveToSpamModal,
    };
};
