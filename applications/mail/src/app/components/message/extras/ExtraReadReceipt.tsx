import React from 'react';
import { c } from 'ttag';
import { Icon, InlineLinkButton, useApi, useEventManager, useNotifications, useLoading } from 'react-components';
import { readReceipt } from 'proton-shared/lib/api/messages';

import { MessageExtended } from '../../../models/message';
import { requireReadReceipt } from '../../../helpers/message/messages';

interface Props {
    message: MessageExtended;
}

const ExtraReadReceipt = ({ message }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { ID } = message.data || {};

    if (!requireReadReceipt(message.data)) {
        return null;
    }

    const handleClick = async () => {
        await api(readReceipt(ID));
        await call();
        createNotification({ text: c('Success').t`Read receipt sent` });
    };

    return (
        <div className="bg-white-dm rounded bordered-container p0-5 mb0-5 flex flex-nowrap">
            <Icon name="read" className="flex-item-noshrink mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">{c('Info').t`The sender has requested a read receipt`}</span>
            <span className="flex-item-noshrink flex">
                <InlineLinkButton onClick={() => withLoading(handleClick())} disabled={loading} className="bold">{c(
                    'Action'
                ).t`Send receipt`}</InlineLinkButton>
            </span>
        </div>
    );
};

export default ExtraReadReceipt;
