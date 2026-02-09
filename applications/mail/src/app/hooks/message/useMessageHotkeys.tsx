import type { RefObject } from 'react';
import { useRef } from 'react';

import { c } from 'ttag';

import type { HotkeyTuple } from '@proton/components';
import { useEventManager, useHotkeys, useNotifications } from '@proton/components';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { isVisibleOnScreen } from '@proton/shared/lib/helpers/dom';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import useFlag from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { SOURCE_ACTION } from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import {
    MESSAGE_FILTER_DROPDOWN_ID,
    MESSAGE_FOLDER_DROPDOWN_ID,
    MESSAGE_LABEL_DROPDOWN_ID,
} from 'proton-mail/components/message/extrasHeader/constants';

import { useOnCompose } from '../../containers/ComposeProvider';
import { hasLabel, isStarred } from '../../helpers/elements';
import type { Element } from '../../models/element';
import { APPLY_LOCATION_TYPES } from '../actions/applyLocation/interface';
import { useApplyLocation } from '../actions/applyLocation/useApplyLocation';
import { useMarkAs } from '../actions/markAs/useMarkAs';
import { useMoveToFolder } from '../actions/move/useMoveToFolder';
import { ComposeTypes } from '../composer/useCompose';

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
    }: MessageHotkeysHandlers
) => {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const labelDropdownToggleRef = useRef<() => void>(noop);
    const moveDropdownToggleRef = useRef<() => void>(noop);
    const filterDropdownToggleRef = useRef<() => void>(noop);

    const { markAs } = useMarkAs();
    const { applyLocation } = useApplyLocation();
    const { moveScheduledModal, moveSnoozedModal, moveToSpamModal } = useMoveToFolder();

    const onCompose = useOnCompose();
    const isRetentionPoliciesEnabled = useFlag('DataRetentionPolicy');

    const isMessageReady = messageLoaded && bodyLoaded;
    const hotkeysEnabledAndMessageReady =
        mailSettings.Shortcuts && isMessageReady && expanded && message.messageDocument?.initialized;

    const isScheduledMessage = message.data?.LabelIDs?.includes(MAILBOX_LABEL_IDS.SCHEDULED);
    const isSoftDeleted = message.data?.LabelIDs?.includes(MAILBOX_LABEL_IDS.SOFT_DELETED);

    const moveElementTo = async (e: KeyboardEvent, LabelID: MAILBOX_LABEL_IDS) => {
        if (!message.data) {
            return;
        }

        await applyLocation({
            type: APPLY_LOCATION_TYPES.MOVE,
            elements: [message.data],
            destinationLabelID: LabelID,
        });
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

    const handleComposeNewMessage = (action: MESSAGE_ACTIONS) => async (e: KeyboardEvent) => {
        if (hotkeysEnabledAndMessageReady && !isScheduledMessage) {
            e.stopPropagation();
            e.preventDefault();
            if (isSoftDeleted) {
                return createNotification({
                    text: c('Error').t`That action can't be performed on emails in this folder`,
                    type: 'error',
                });
            }
            void onCompose({ type: ComposeTypes.newMessage, action, referenceMessage: message });
        }
    };

    const shortcutHandlers: HotkeyTuple[] = [
        [
            'Enter',
            (e) => {
                const isInDeletedFolder =
                    isRetentionPoliciesEnabled && hasLabel(message.data, MAILBOX_LABEL_IDS.SOFT_DELETED);
                if (draft && !isInDeletedFolder) {
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
                if (mailSettings.Shortcuts && isMessageReady && expanded) {
                    toggleOriginalMessage();
                }
            },
        ],
        ['R', handleComposeNewMessage(MESSAGE_ACTIONS.REPLY)],
        [['Shift', 'R'], handleComposeNewMessage(MESSAGE_ACTIONS.REPLY_ALL)],
        [['Shift', 'F'], handleComposeNewMessage(MESSAGE_ACTIONS.FORWARD)],
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

                    await applyLocation({
                        type: APPLY_LOCATION_TYPES.STAR,
                        removeLabel: isStarred(message.data),
                        elements: [message.data as Element],
                        destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                        showSuccessNotification: false,
                    });
                }
            },
        ],
        [
            'I',
            async (e) => {
                if (hotkeysEnabledAndMessageReady) {
                    e.stopPropagation();
                    await moveElementTo(e, MAILBOX_LABEL_IDS.INBOX);
                }
            },
        ],
        [
            'A',
            async (e) => {
                if (hotkeysEnabledAndMessageReady) {
                    e.stopPropagation();
                    await moveElementTo(e, MAILBOX_LABEL_IDS.ARCHIVE);
                }
            },
        ],
        [
            'S',
            async (e) => {
                if (hotkeysEnabledAndMessageReady) {
                    e.stopPropagation();
                    await moveElementTo(e, MAILBOX_LABEL_IDS.SPAM);
                }
            },
        ],
        [
            'T',
            async (e) => {
                if (hotkeysEnabledAndMessageReady) {
                    e.stopPropagation();
                    await moveElementTo(e, MAILBOX_LABEL_IDS.TRASH);
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
