import React from 'react';
import { c } from 'ttag';
import { useLabels, Icon, classnames } from 'react-components';
import { MailSettings } from 'proton-shared/lib/interfaces';

import MessageView from '../message/MessageView';
import ItemStar from '../list/ItemStar';
import ItemLabels from '../list/ItemLabels';
import { useMessage } from '../../hooks/useMessage';
import { getNumParticipants } from '../../helpers/addresses';
import { Message } from '../../models/message';
import { OnCompose } from '../../hooks/useCompose';
import { useShouldMoveOut } from '../../hooks/useShouldMoveOut';

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

    // There is only reading on the message here, no actions
    // MessageView will be in charge to trigger all messages actions
    const { message, loading } = useMessage(messageID);

    useShouldMoveOut(false, messageID, loading, onBack);

    // Message content could be undefined
    const data = message.data || ({ ID: messageID } as Message);
    const numParticipants = getNumParticipants(data);

    return (
        <>
            <header
                className={classnames([
                    'border-bottom mw100 message-conversation-summary p0-5 pb1 flex-item-noshrink',
                    hidden && 'hidden'
                ])}
            >
                <div className="flex flex-nowrap mb1">
                    <h2 className="mb0 h3 ellipsis lh-standard flex-item-fluid pr1" title={data?.Subject}>
                        {data?.Subject}
                    </h2>
                    <div className="flex-item-noshrink pt0-25">
                        <ItemStar element={data} />
                    </div>
                </div>
                <div className="flex flex-nowrap">
                    <div className="flex-item-fluid flex flex-items-center pr1">
                        <span className="mr1 flex flex-items-center flex-item-noshrink">
                            <Icon name="email-address" className="opacity-50" alt={c('label').t`Number of messages:`} />
                            <span className="ml0-25">1</span>
                        </span>
                        <span className="mr1 flex flex-items-center flex-item-noshrink">
                            <Icon name="contact" className="opacity-50" alt={c('label').t`Number of participants:`} />
                            <span className="ml0-25">{numParticipants}</span>
                        </span>
                    </div>
                    <div className="flex-item-noshrink">
                        <ItemLabels labels={labels} max={4} element={data} />
                    </div>
                </div>
            </header>

            <div className={classnames(['scroll-if-needed flex-item-fluid pt0-5 mw100', hidden && 'hidden'])}>
                <MessageView
                    labelID={labelID}
                    conversationMode={false}
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
