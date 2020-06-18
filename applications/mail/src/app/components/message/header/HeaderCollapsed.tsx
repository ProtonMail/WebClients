import React, { MouseEvent } from 'react';
import { c } from 'ttag';
import { classnames, useContactEmails } from 'react-components';
import { MailSettings } from 'proton-shared/lib/interfaces';

import ItemStar from '../../list/ItemStar';
import ItemDate from '../../list/ItemDate';
import { isDraft, hasAttachments } from '../../../helpers/message/messages';
import ItemLocation from '../../list/ItemLocation';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import { MessageViewIcons } from '../../../helpers/message/icon';
import { MessageExtended } from '../../../models/message';
import HeaderRecipientItem from './HeaderRecipientItem';
import { OnCompose } from '../../../containers/ComposerContainer';
import ItemExpiration from '../../list/ItemExpiration';
import ItemAction from '../../list/ItemAction';

interface Props {
    labelID: string;
    message: MessageExtended;
    messageViewIcons?: MessageViewIcons;
    mailSettings: MailSettings;
    isSentMessage: boolean;
    isUnreadMessage: boolean;
    isDraftMessage: boolean;
    onExpand: () => void;
    onCompose: OnCompose;
}

const HeaderCollapsed = ({
    labelID,
    message,
    messageViewIcons,
    mailSettings,
    isSentMessage,
    isUnreadMessage,
    onExpand,
    onCompose
}: Props) => {
    const [contacts = []] = useContactEmails();

    const handleClick = (event: MouseEvent) => {
        if ((event.target as HTMLElement).closest('.stop-propagation')) {
            event.stopPropagation();
            return;
        }

        onExpand();
    };

    const isDraftMessage = isDraft(message.data);

    return (
        <div
            className={classnames([
                'message-header message-header-collapsed flex flex-nowrap flex-items-center cursor-pointer',
                isSentMessage ? 'is-outbound' : 'is-inbound',
                isUnreadMessage && 'unread'
            ])}
            onClick={handleClick}
        >
            <div className="flex flex-item-fluid flex-nowrap flex-items-center pr0-5">
                <HeaderRecipientItem
                    recipientOrGroup={{ recipient: message.data?.Sender }}
                    globalIcon={messageViewIcons?.globalIcon}
                    showAddress={false}
                    onCompose={onCompose}
                    contacts={contacts}
                />
                <ItemExpiration element={message.data} className="ml0-5" />
                <ItemAction element={message.data} className="ml0-5" />
            </div>
            <div className="flex flex-items-center flex-item-noshrink">
                {isDraftMessage && <span className="badgeLabel-success">{c('Info').t`Draft`}</span>}
                {!!hasAttachments(message.data) && (
                    <span className="ml0-5 inline-flex">
                        <ItemAttachmentIcon element={message.data} className="mauto" />
                    </span>
                )}
                <span className="ml0-5 inline-flex">
                    <ItemLocation message={message.data} mailSettings={mailSettings} />
                </span>
                <ItemDate className="ml0-5" element={message.data} labelID={labelID} />
                <span className="ml0-5 inline-flex">
                    <ItemStar element={message.data} />
                </span>
            </div>
        </div>
    );
};

export default HeaderCollapsed;
