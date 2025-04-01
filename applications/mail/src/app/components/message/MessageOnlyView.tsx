import { useEffect, useRef, useState } from 'react';

import { Scroll } from '@proton/atoms';
import type { Breakpoints } from '@proton/components';
import { useHotkeys } from '@proton/components';
import { useLabels } from '@proton/mail';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isDraft } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import { useMailDispatch } from 'proton-mail/store/hooks';

import useClickOutsideFocusedMessage from '../../hooks/conversation/useClickOutsideFocusedMessage';
import { useLoadMessage } from '../../hooks/message/useLoadMessage';
import { useMessage } from '../../hooks/message/useMessage';
import { removeAllQuickReplyFlags } from '../../store/messages/draft/messagesDraftActions';
import type { MessageWithOptionalBody } from '../../store/messages/messagesTypes';
import ConversationHeader from '../conversation/ConversationHeader';
import type { MessageViewRef } from './MessageView';
import MessageView from './MessageView';

interface Props {
    hidden: boolean;
    labelID: string;
    messageID: string;
    mailSettings: MailSettings;
    onBack: () => void;
    breakpoints: Breakpoints;
    onMessageReady: () => void;
    columnLayout: boolean;
    isComposerOpened: boolean;
}

const MessageOnlyView = ({
    hidden,
    labelID,
    messageID,
    mailSettings,
    onBack,
    breakpoints,
    onMessageReady,
    columnLayout,
    isComposerOpened,
}: Props) => {
    const [labels = []] = useLabels();

    const [isMessageFocused, setIsMessageFocused] = useState(false);
    const [isMessageReady, setIsMessageReady] = useState(false);
    const { message, messageLoaded } = useMessage(messageID);
    const load = useLoadMessage(message.data || ({ ID: messageID } as MessageWithOptionalBody));

    const dispatch = useMailDispatch();

    // Manage loading the message
    useEffect(() => {
        if (
            !messageLoaded &&
            /**
             * Draft content is not displayed, metadata is enough
             * So we don't load draft message if we are in the drafts folder
             * Composer will load it if we open it
             */
            labelID !== MAILBOX_LABEL_IDS.DRAFTS &&
            labelID !== MAILBOX_LABEL_IDS.ALL_DRAFTS
        ) {
            void load();
        }
    }, [messageLoaded]);

    useEffect(() => {
        // When the user is switching message we need to remove potential quick replies draft flags
        dispatch(removeAllQuickReplyFlags());
    }, [messageID]);

    // Message content could be undefined
    const data = message.data || ({ ID: messageID } as Message);

    const messageContainerRef = useRef(null);

    useHotkeys(messageContainerRef, [
        [
            'ArrowLeft',
            (e) => {
                e.preventDefault();
                e.stopPropagation();

                const element = document.querySelector('[data-shortcut-target="navigation-link inbox"]') as HTMLElement;
                if (element) {
                    element.focus();
                    setIsMessageFocused(false);
                }
            },
        ],
    ]);

    const messageRef = useRef<MessageViewRef>(null);

    useClickOutsideFocusedMessage(messageID, () => {
        setIsMessageFocused(false);
    });
    const handleBlurCallback = () => {
        setIsMessageFocused(false);
    };
    const handleFocusCallback = () => {
        setIsMessageFocused(true);
    };

    const handleMessageReadyCallback = () => {
        setIsMessageReady(true);
        onMessageReady();
    };

    useEffect(() => {
        if (!isDraft(message.data)) {
            messageRef?.current?.expand();
        }

        return () => {
            setIsMessageReady(false);
        };
    }, [messageID]);

    const handleGetMessageElement = () => {
        const selector = `[data-shortcut-target="message-container"][data-message-id="${messageID}"]`;

        return document.querySelector(selector) as HTMLElement;
    };

    const handleOpenQuickReply = () => {
        const element = handleGetMessageElement();

        element?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    };

    useEffect(() => {
        if (messageID && isMessageReady) {
            const element = handleGetMessageElement();
            element?.focus({ preventScroll: true });
            setIsMessageFocused(true);
        }
    }, [messageID, isMessageReady]);

    return (
        <Scroll className={clsx([hidden && 'hidden'])}>
            <ConversationHeader
                className={clsx([hidden && 'hidden'])}
                loading={!messageLoaded}
                element={message.data}
            />
            <div className="flex-1 px-4 mt-4 max-w-full outline-none" ref={messageContainerRef} tabIndex={-1}>
                <MessageView
                    // Break the reuse of the MessageView accross multiple message
                    // Solve a lot of reuse issues, reproduce the same as in conversation mode with a map on conversation messages
                    key={message.localID}
                    ref={messageRef}
                    labelID={labelID}
                    conversationMode={false}
                    loading={!messageLoaded}
                    message={data}
                    labels={labels}
                    mailSettings={mailSettings}
                    onBack={onBack}
                    breakpoints={breakpoints}
                    onMessageReady={handleMessageReadyCallback}
                    columnLayout={columnLayout}
                    isComposerOpened={isComposerOpened}
                    onBlur={handleBlurCallback}
                    onFocus={handleFocusCallback}
                    hasFocus={isMessageFocused}
                    onOpenQuickReply={handleOpenQuickReply}
                />
            </div>
        </Scroll>
    );
};

export default MessageOnlyView;
