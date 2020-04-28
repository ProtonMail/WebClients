import React, { MouseEvent } from 'react';
import { classnames } from 'react-components';
import { c } from 'ttag';
import { Label } from 'proton-shared/lib/interfaces/Label';

import ItemStar from '../../list/ItemStar';
import ItemDate from '../../list/ItemDate';
import EncryptionStatusIcon from '../EncryptionStatusIcon';
import ItemLabels from '../../list/ItemLabels';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import { Message } from '../../../models/message';
import { MessageViewIcons } from '../../../helpers/message/icon';

interface Props {
    message?: Message;
    messageViewIcons?: MessageViewIcons;
    isSentMessage: boolean;
    isUnreadMessage: boolean;
    isDraftMessage: boolean;
    labels: Label[];
    onExpand: () => void;
}

const HeaderCollapsed = ({
    message,
    messageViewIcons,
    isSentMessage,
    isUnreadMessage,
    isDraftMessage,
    labels,
    onExpand
}: Props) => {
    const { Name, Address } = message?.Sender || {};

    const handleClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.classList.contains('item-star') || target.closest('.item-star')) {
            event.stopPropagation();
            return;
        }

        onExpand();
    };

    const icon = messageViewIcons?.globalIcon;

    return (
        <div
            className={classnames([
                'message-header message-header-collapsed flex flex-nowrap flex-items-center flex-spacebetween cursor-pointer',
                isSentMessage ? 'is-outbound' : 'is-inbound',
                isUnreadMessage && 'unread'
            ])}
            onClick={handleClick}
        >
            <div className="flex flex-items-center">
                <span className="mr0-5">{c('Label').t`From:`}</span>
                <span className="bold mr0-5" title={Name}>
                    {Name}
                </span>
                <i title={Address}>&lt;{Address}&gt;</i>
                {icon && (
                    <span className="flex pl0-25 pr0-25 flex-item-noshrink">
                        <EncryptionStatusIcon {...icon} />
                    </span>
                )}
            </div>
            <div>
                {isDraftMessage && <span className="badgeLabel-success">{c('Info').t`Draft`}</span>}
                <ItemAttachmentIcon element={message} />
                <ItemLabels element={message} labels={labels} className="mr1" />
                <ItemDate className="mr1" element={message} />
                <ItemStar element={message} />
            </div>
        </div>
    );
};

export default HeaderCollapsed;
