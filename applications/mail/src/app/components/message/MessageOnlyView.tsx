import React, { useEffect } from 'react';
import { Loader, useLabels } from 'react-components';

import MessageView from '../message/MessageView';
import ItemStar from '../list/ItemStar';
import { ELEMENT_TYPES } from '../../constants';
import ItemLabels from '../list/ItemLabels';
import { useMessage } from '../../hooks/useMessage';

interface Props {
    messageID: string;
    mailSettings: any;
}

const MessageOnlyView = ({ messageID, mailSettings }: Props) => {
    const [labels] = useLabels();

    const [{ data: message, loaded }, { load }] = useMessage({ ID: messageID }, mailSettings);
    const loading = !loaded;

    useEffect(() => {
        if (!loaded) {
            load();
        }
    }, [messageID, loaded]);

    if (loading) {
        return <Loader />;
    }

    if (!message) {
        return null;
    }

    return (
        <>
            <header className="flex flex-nowrap flex-spacebetween flex-items-center mb1">
                <h2 className="mb0">{message.Subject}</h2>
                <div>
                    <ItemLabels labels={labels} max={4} element={message} type={ELEMENT_TYPES.MESSAGE} />
                    <ItemStar element={message} type={ELEMENT_TYPES.MESSAGE} />
                </div>
            </header>
            <MessageView message={message} initialExpand={true} labels={labels} mailSettings={mailSettings} />
        </>
    );
};

export default MessageOnlyView;
