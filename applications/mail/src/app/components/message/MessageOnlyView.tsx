import React, { useEffect } from 'react';
import { useLabels, classnames } from 'react-components';
import { MailSettings } from 'proton-shared/lib/interfaces';

import MessageView from '../message/MessageView';
import { useMessage } from '../../hooks/useMessage';
import { Message } from '../../models/message';
import { OnCompose } from '../../hooks/useCompose';
import { useShouldMoveOut } from '../../hooks/useShouldMoveOut';
import { useLoadMessage } from '../../hooks/useMessageReadActions';
import ConversationHeader from '../conversation/ConversationHeader';

interface Props {
    hidden: boolean;
    labelID: string;
    messageID: string;
    mailSettings: MailSettings;
    onBack: () => void;
    onCompose: OnCompose;
}

const MessageOnlyView = ({ hidden, labelID, messageID, mailSettings, onBack, onCompose }: Props) => {
    const [labels = []] = useLabels();

    const { message, addAction, loading, messageLoaded } = useMessage(messageID);
    const load = useLoadMessage(message.data || ({ ID: messageID } as Message));

    useShouldMoveOut(false, messageID, loading, onBack);

    // Manage loading the message
    useEffect(() => {
        if (!messageLoaded) {
            addAction(load);
        }
    }, [messageLoaded]);

    // Message content could be undefined
    const data = message.data || ({ ID: messageID } as Message);

    return (
        <>
            <ConversationHeader
                className={classnames([hidden && 'hidden'])}
                loading={!messageLoaded}
                element={message.data || {}}
            />
            <div className={classnames(['scroll-if-needed flex-item-fluid pt0-5 mw100', hidden && 'hidden'])}>
                <MessageView
                    labelID={labelID}
                    conversationMode={false}
                    loading={!messageLoaded}
                    message={data}
                    labels={labels}
                    mailSettings={mailSettings}
                    onBack={onBack}
                    onCompose={onCompose}
                />
            </div>
        </>
    );
};

export default MessageOnlyView;
