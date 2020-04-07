import React from 'react';
import { useLabels } from 'react-components';
import { MailSettings } from 'proton-shared/lib/interfaces';

import MessageView from '../message/MessageView';
import ItemStar from '../list/ItemStar';
import ItemLabels from '../list/ItemLabels';
import { OnCompose } from '../../containers/ComposerContainer';
import { useMessage } from '../../hooks/useMessage';

interface Props {
    messageID: string;
    mailSettings: MailSettings;
    onBack: () => void;
    onCompose: OnCompose;
}

const MessageOnlyView = ({ messageID, mailSettings, onBack, onCompose }: Props) => {
    const [labels = []] = useLabels();

    // There is only reading on the message here, no actions
    // MessageView will be in charge to trigger all messages actions
    const { message } = useMessage(messageID);

    // Message content could be undefined
    const data = message.data || { ID: messageID };

    return (
        <>
            <header className="flex flex-nowrap flex-spacebetween flex-items-center mb1">
                <h2 className="mb0">{data?.Subject}</h2>
                <div>
                    <ItemLabels labels={labels} max={4} element={data} />
                    <ItemStar element={data} />
                </div>
            </header>
            <MessageView
                message={data}
                initialExpand={true}
                labels={labels}
                mailSettings={mailSettings}
                onBack={onBack}
                onCompose={onCompose}
            />
        </>
    );
};

export default MessageOnlyView;
