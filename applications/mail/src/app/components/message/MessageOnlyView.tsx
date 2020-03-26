import React from 'react';
import { useLabels } from 'react-components';

import MessageView from '../message/MessageView';
import ItemStar from '../list/ItemStar';
import ItemLabels from '../list/ItemLabels';
import { useMessage } from '../../hooks/useMessage';
import { OnCompose } from '../../containers/ComposerContainer';

interface Props {
    messageID: string;
    mailSettings: any;
    onCompose: OnCompose;
}

const MessageOnlyView = ({ messageID, mailSettings, onCompose }: Props) => {
    const [labels = []] = useLabels();

    // There is only reading on the message here, no actions
    // MessageView will be in charge to trigger all messages actions
    const [message] = useMessage({ localID: messageID, data: { ID: messageID } }, mailSettings);

    if (!message.data) {
        return null;
    }

    return (
        <>
            <header className="flex flex-nowrap flex-spacebetween flex-items-center mb1">
                <h2 className="mb0">{message.data?.Subject}</h2>
                <div>
                    <ItemLabels labels={labels} max={4} element={message.data} />
                    <ItemStar element={message.data} />
                </div>
            </header>
            <MessageView
                message={message.data}
                initialExpand={true}
                labels={labels}
                mailSettings={mailSettings}
                onCompose={onCompose}
            />
        </>
    );
};

export default MessageOnlyView;
