import { useEffect, useRef, useState } from 'react';

import { Scroll, classnames, useHotkeys, useLabels } from '@proton/components';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isDraft } from '@proton/shared/lib/mail/messages';

import useClickOutsideFocusedMessage from '../../hooks/conversation/useClickOutsideFocusedMessage';
import { useLoadMessage } from '../../hooks/message/useLoadMessage';
import { useMessage } from '../../hooks/message/useMessage';
import { useShouldMoveOut } from '../../hooks/useShouldMoveOut';
import { Breakpoints } from '../../models/utils';
import ConversationHeader from '../conversation/ConversationHeader';
import MessageView, { MessageViewRef } from './MessageView';

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
    const { message, messageLoaded, bodyLoaded } = useMessage(messageID);
    const load = useLoadMessage(message.data || ({ ID: messageID } as Message));

    useShouldMoveOut(false, messageID, !bodyLoaded, onBack);

    // Manage loading the message
    useEffect(() => {
        if (!messageLoaded) {
            void load();
        }
    }, [messageLoaded]);

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

    useEffect(() => {
        if (messageID && isMessageReady) {
            const selector = `[data-shortcut-target="message-container"][data-message-id="${messageID}"]`;

            const element = document.querySelector(selector) as HTMLElement;

            element?.focus();
            setIsMessageFocused(true);
        }
    }, [messageID, isMessageReady]);

    return (
        <>
            <ConversationHeader
                className={classnames([hidden && 'hidden'])}
                loading={!messageLoaded}
                element={message.data}
            />
            <Scroll className={classnames([hidden && 'hidden'])}>
                <div
                    className="flex-item-fluid px1 mt1-25 max-w100 outline-none"
                    ref={messageContainerRef}
                    tabIndex={-1}
                >
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
                    />
                </div>
            </Scroll>
        </>
    );
};

export default MessageOnlyView;
