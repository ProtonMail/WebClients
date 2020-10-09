import { hasAttachments, isDraft } from 'proton-shared/lib/mail/messages';
import React, { MouseEvent } from 'react';
import { c } from 'ttag';
import { classnames, useContactEmails } from 'react-components';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { Label } from 'proton-shared/lib/interfaces/Label';

import ItemStar from '../../list/ItemStar';
import ItemDate from '../../list/ItemDate';
import ItemLabels from '../../list/ItemLabels';
import ItemLocation from '../../list/ItemLocation';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import { MessageExtended } from '../../../models/message';
import HeaderRecipientItem from './HeaderRecipientItem';
import ItemExpiration from '../../list/ItemExpiration';
import { OnCompose } from '../../../hooks/useCompose';

interface Props {
    labelID: string;
    labels?: Label[];
    message: MessageExtended;
    messageLoaded: boolean;
    mailSettings: MailSettings;
    isSentMessage: boolean;
    isUnreadMessage: boolean;
    isDraftMessage: boolean;
    onExpand: () => void;
    onCompose: OnCompose;
}

const HeaderCollapsed = ({
    labelID,
    labels,
    message,
    messageLoaded,
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
                isUnreadMessage && 'is-unread',
                !messageLoaded && 'is-loading'
            ])}
            onClick={handleClick}
        >
            <div className="flex flex-item-fluid flex-nowrap flex-items-center pr0-5">
                <HeaderRecipientItem
                    recipientOrGroup={{ recipient: message.data?.Sender }}
                    showAddress={false}
                    onCompose={onCompose}
                    contacts={contacts}
                    isLoading={!messageLoaded}
                    message={message}
                />
                {messageLoaded && (
                    <>
                        <ItemExpiration
                            element={message.data}
                            className="flex flex-item-noshrink ml0-25 is-appearing-content"
                        />
                    </>
                )}
            </div>
            <div className="flex flex-items-center flex-item-noshrink">
                {messageLoaded ? (
                    <>
                        <ItemLabels
                            className="nomobile"
                            element={message.data}
                            labels={labels}
                            showUnlabel
                            maxNumber={5}
                        />

                        {isDraftMessage && (
                            <span className="badgeLabel-success ml0-5 is-appearing-content">{c('Info').t`Draft`}</span>
                        )}

                        {!!hasAttachments(message.data) && (
                            <span className="ml0-5 inline-flex is-appearing-content">
                                <ItemAttachmentIcon element={message.data} className="mauto" />
                            </span>
                        )}

                        <span className="ml0-5 inline-flex is-appearing-content">
                            <ItemLocation message={message.data} mailSettings={mailSettings} />
                        </span>

                        <ItemDate className="ml0-5 is-appearing-content" element={message.data} labelID={labelID} />
                    </>
                ) : (
                    <span className="message-header-metas ml0-5 inline-flex"></span>
                )}
                <span className="message-header-star ml0-5 inline-flex">
                    <ItemStar element={message.data} />
                </span>
            </div>
        </div>
    );
};

export default HeaderCollapsed;
