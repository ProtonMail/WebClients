import React, { useEffect, useRef } from 'react';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { useLabels, classnames, useHotkeys } from 'react-components';
import { MailSettings } from 'proton-shared/lib/interfaces';

import MessageView from './MessageView';
import { useMessage } from '../../hooks/message/useMessage';
import { OnCompose } from '../../hooks/composer/useCompose';
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
    onCompose: OnCompose;
    breakpoints: Breakpoints;
}

const MessageOnlyView = ({ hidden, labelID, messageID, mailSettings, onBack, onCompose, breakpoints }: Props) => {
    const [labels = []] = useLabels();

    const { message, addAction, loading, messageLoaded } = useMessage(messageID);
    const load = useLoadMessage(message.data || ({ ID: messageID } as Message));

    useShouldMoveOut(false, messageID, loading, onBack);

    // Manage loading the message
    useEffect(() => {
        if (!messageLoaded) {
            void addAction(load);
        }
    }, [messageLoaded]);

    // Message content could be undefined
    const data = message.data || ({ ID: messageID } as Message);

    const messageRef = useRef(null);

    useHotkeys(messageRef, [
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

    return (
        <>
            <ConversationHeader
                className={classnames([hidden && 'hidden'])}
                loading={!messageLoaded}
                element={message.data || {}}
                labelID={labelID}
                breakpoints={breakpoints}
            />
            <div
                className={classnames(['scroll-if-needed flex-item-fluid pt0-5 mw100', hidden && 'hidden'])}
                ref={messageRef}
                tabIndex={-1}
                style={{ outline: 'none' }}
            >
                <MessageView
                    labelID={labelID}
                    conversationMode={false}
                    loading={!messageLoaded}
                    message={data}
                    labels={labels}
                    mailSettings={mailSettings}
                    onBack={onBack}
                    onCompose={onCompose}
                    breakpoints={breakpoints}
                />
            </div>
        </>
    );
};

export default MessageOnlyView;
