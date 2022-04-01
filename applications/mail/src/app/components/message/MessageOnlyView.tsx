import { useEffect, useRef, useState } from 'react';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { useLabels, classnames, useHotkeys, Scroll } from '@proton/components';
import { MailSettings } from '@proton/shared/lib/interfaces';

import { isDraft } from '@proton/shared/lib/mail/messages';
import MessageView, { MessageViewRef } from './MessageView';
import { useMessage } from '../../hooks/message/useMessage';
import { useShouldMoveOut } from '../../hooks/useShouldMoveOut';
import { useLoadMessage } from '../../hooks/message/useLoadMessage';
import ConversationHeader from '../conversation/ConversationHeader';
import { Breakpoints } from '../../models/utils';

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

    const [hasScrollShadow, setHasScrollShadow] = useState(false);
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
                const element =
                    (document.querySelector(
                        '[data-shortcut-target="item-container"][data-shortcut-target-selected="true"]'
                    ) as HTMLElement) ||
                    (document.querySelector('[data-shortcut-target="item-container"]') as HTMLElement);
                element?.focus();
            },
        ],
    ]);

    const messageRef = useRef<MessageViewRef>(null);

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
                hasScrollShadow={hasScrollShadow}
            />
            <Scroll className={classnames([hidden && 'hidden'])} setHasScrollShadow={setHasScrollShadow}>
                <div
                    className="flex-item-fluid pt1 pr1 pl1 max-w100 outline-none"
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
