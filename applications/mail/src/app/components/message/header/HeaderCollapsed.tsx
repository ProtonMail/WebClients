import { hasAttachments, isDraft, isOutbox } from 'proton-shared/lib/mail/messages';
import React, { MouseEvent } from 'react';
import { c } from 'ttag';
import { classnames, useContactEmails } from 'react-components';
import { Label } from 'proton-shared/lib/interfaces/Label';

import ItemStar from '../../list/ItemStar';
import ItemDate from '../../list/ItemDate';
import ItemLabels from '../../list/ItemLabels';
import ItemLocation from '../../list/ItemLocation';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import { MessageExtended } from '../../../models/message';
import RecipientItem from '../recipients/RecipientItem';
import ItemExpiration from '../../list/ItemExpiration';
import { OnCompose } from '../../../hooks/useCompose';
import ItemAction from '../../list/ItemAction';
import { Breakpoints } from '../../../models/utils';

interface Props {
    labelID: string;
    labels?: Label[];
    message: MessageExtended;
    messageLoaded: boolean;
    isSentMessage: boolean;
    isUnreadMessage: boolean;
    onExpand: () => void;
    onCompose: OnCompose;
    breakpoints: Breakpoints;
}

const HeaderCollapsed = ({
    labelID,
    labels,
    message,
    messageLoaded,
    isSentMessage,
    isUnreadMessage,
    onExpand,
    onCompose,
    breakpoints,
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
    const isOutboxMessage = isOutbox(message.data);

    return (
        <div
            className={classnames([
                'message-header message-header-collapsed flex flex-nowrap flex-items-center cursor-pointer',
                isSentMessage ? 'is-outbound' : 'is-inbound',
                isUnreadMessage && 'is-unread',
                !messageLoaded && 'is-loading',
            ])}
            onClick={handleClick}
        >
            <div className="flex flex-item-fluid flex-nowrap flex-items-center mr0-5">
                <RecipientItem
                    recipientOrGroup={{ recipient: message.data?.Sender }}
                    showAddress={false}
                    onCompose={onCompose}
                    contacts={contacts}
                    isLoading={!messageLoaded}
                />

                {messageLoaded && (
                    <ItemAction element={message.data} className="flex-item-noshrink mtauto mbauto ml0-25" />
                )}

                {messageLoaded && isDraftMessage && (
                    <span className="badgeLabel-success ml0-5 flex-item-noshrink is-appearing-content">{c('Info')
                        .t`Draft`}</span>
                )}
                {messageLoaded && isOutboxMessage && (
                    <span className="badgeLabel-primary ml0-5 flex-item-noshrink is-appearing-content">{c('Info')
                        .t`Sending`}</span>
                )}
            </div>
            <div className="flex flex-items-center flex-nowrap flex-item-noshrink">
                {messageLoaded ? (
                    <>
                        <ItemLabels
                            className="nomobile"
                            element={message.data}
                            labels={labels}
                            labelID={labelID}
                            showUnlabel
                            maxNumber={breakpoints.isTablet ? 1 : 5}
                        />

                        {!!hasAttachments(message.data) && (
                            <span className="ml0-5 flex is-appearing-content">
                                <ItemAttachmentIcon element={message.data} labelID={labelID} className="mauto" />
                            </span>
                        )}

                        <span className="ml0-5 flex is-appearing-content">
                            <ItemLocation element={message.data} labelID={labelID} />
                        </span>

                        <ItemExpiration
                            element={message.data}
                            className="flex flex-item-noshrink ml0-25 mr0-25 is-appearing-content"
                        />

                        <ItemDate className="ml0-25 is-appearing-content" element={message.data} labelID={labelID} />
                    </>
                ) : (
                    <span className="message-header-metas ml0-5 flex" />
                )}
                <span className="message-header-star ml0-5 flex">
                    <ItemStar element={message.data} />
                </span>
            </div>
        </div>
    );
};

export default HeaderCollapsed;
