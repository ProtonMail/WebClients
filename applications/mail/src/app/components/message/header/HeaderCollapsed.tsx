import React, { MouseEvent } from 'react';
import { c } from 'ttag';
import { Label } from 'proton-shared/lib/interfaces/Label';

import ItemStar from '../../list/ItemStar';
import ItemDate from '../../list/ItemDate';
import MessageLock from '../MessageLock';
import { isSent, isDraft } from '../../../helpers/message/messages';
import ItemLabels from '../../list/ItemLabels';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import { MessageExtended } from '../../../models/message';
import { isUnread } from '../../../helpers/elements';
import { classnames } from 'react-components';

interface Props {
    message: MessageExtended;
    labels: Label[];
    onExpand: () => void;
}

const HeaderCollapsed = ({ message, labels, onExpand }: Props) => {
    const { Name, Address } = (message.data || {}).Sender || {};

    const handleClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.classList.contains('item-star') || target.closest('.item-star')) {
            event.stopPropagation();
            return;
        }

        onExpand();
    };

    const sent = isSent(message.data);
    const unread = isUnread(message.data);

    return (
        <div
            className={classnames([
                'message-header message-header-collapsed flex flex-nowrap flex-items-center flex-spacebetween cursor-pointer',
                sent ? 'is-outbound' : 'is-inbound',
                unread && 'unread'
            ])}
            onClick={handleClick}
        >
            <div>
                <span className="mr0-5">{c('Label').t`From:`}</span>
                <span className="bold mr0-5" title={Name}>
                    {Name}
                </span>
                <i title={Address}>&lt;{Address}&gt;</i>
                <MessageLock message={message} />
            </div>
            <div>
                {isDraft(message.data) && <span className="badgeLabel-success">{c('Info').t`Draft`}</span>}
                <ItemAttachmentIcon element={message.data} />
                <ItemLabels element={message.data} labels={labels} className="mr1" />
                <ItemDate className="mr1" element={message.data} />
                <ItemStar element={message.data} />
            </div>
        </div>
    );
};

export default HeaderCollapsed;
