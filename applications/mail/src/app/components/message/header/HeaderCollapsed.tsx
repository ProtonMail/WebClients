import { MouseEvent } from 'react';

import { c } from 'ttag';

import { Label } from '@proton/shared/lib/interfaces/Label';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import {
    getHasOnlyIcsAttachments,
    hasAttachments,
    isDraft,
    isExpiring,
    isScheduled,
} from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { MessageState } from '../../../logic/messages/messagesTypes';
import { Breakpoints } from '../../../models/utils';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import ItemDate from '../../list/ItemDate';
import ItemLabels from '../../list/ItemLabels';
import ItemLocation from '../../list/ItemLocation';
import ItemStar from '../../list/ItemStar';
import ItemUnread from '../../list/ItemUnread';
import ItemExpiration from '../../list/item-expiration/ItemExpiration';
import RecipientItem from '../recipients/RecipientItem';

interface Props {
    labelID: string;
    labels?: Label[];
    message: MessageState;
    messageLoaded: boolean;
    isSentMessage: boolean;
    isUnreadMessage: boolean;
    onExpand: () => void;
    breakpoints: Breakpoints;
    conversationIndex?: number;
}

const HeaderCollapsed = ({
    labelID,
    labels,
    message,
    messageLoaded,
    isSentMessage,
    isUnreadMessage,
    onExpand,
    breakpoints,
    conversationIndex = 0,
}: Props) => {
    const handleClick = (event: MouseEvent) => {
        if ((event.target as HTMLElement).closest('.stop-propagation')) {
            event.stopPropagation();
            return;
        }

        onExpand();
    };

    const isDraftMessage = isDraft(message.data) && !message.draftFlags?.sending;
    const isOutboxMessage = message.draftFlags?.sending;
    const isScheduledMessage = isScheduled(message.data);
    const isExpiringMessage = isExpiring(message.data);
    const hasOnlyIcsAttachments = getHasOnlyIcsAttachments(message.data?.AttachmentInfo);

    return (
        <div
            className={clsx([
                'message-header message-header-collapsed px-5 flex flex-nowrap flex-align-items-center',
                isSentMessage ? 'is-outbound' : 'is-inbound',
                isUnreadMessage && 'is-unread',
                !messageLoaded && 'is-loading',
                !message.draftFlags?.sending && 'cursor-pointer',
            ])}
            onClick={handleClick}
            data-testid={`message-header-collapsed:${conversationIndex}`}
        >
            <div className="flex flex-item-fluid flex-nowrap flex-align-items-center mr-2">
                <RecipientItem
                    message={message}
                    recipientOrGroup={{ recipient: message.data?.Sender }}
                    isLoading={!messageLoaded}
                    showDropdown={false}
                    hideAddress={true}
                    onContactDetails={noop}
                    onContactEdit={noop}
                />

                {messageLoaded && isDraftMessage && (
                    <span className="badge-label-success ml-2 flex-item-noshrink">{c('Info').t`Draft`}</span>
                )}
                {messageLoaded && isOutboxMessage && !isScheduledMessage && (
                    <span className="badge-label-primary ml-2 flex-item-noshrink">{c('Info').t`Sending`}</span>
                )}
                {messageLoaded && isExpiringMessage && (
                    <ItemExpiration
                        className="badge-label-weak ml-2 py-0-5 TOCHECK flex-item-no-shrink"
                        expirationTime={message.data?.ExpirationTime}
                        element={message.data as Message}
                        labelID={labelID}
                    />
                )}

                {messageLoaded && (
                    <div className="ml-2 flex-item-fluid flex flex-nowrap">
                        <ItemLabels
                            className="hidden md:inline-flex"
                            element={message.data}
                            labels={labels}
                            labelID={labelID}
                            maxNumber={breakpoints.isTablet ? 1 : 5}
                            isCollapsed={false}
                            data-testid="message-header-collapsed:labels"
                        />
                    </div>
                )}
            </div>
            <div className="flex flex-align-items-center flex-nowrap flex-item-noshrink">
                {messageLoaded ? (
                    <>
                        <span className="message-header-star mr-2 flex">
                            <ItemStar element={message.data} />
                        </span>

                        <span className="flex">
                            <ItemLocation element={message.data} labelID={labelID} />
                        </span>

                        {!!hasAttachments(message.data) && (
                            <span className="mr-2 flex">
                                <ItemAttachmentIcon
                                    icon={hasOnlyIcsAttachments ? 'calendar-grid' : undefined}
                                    element={message.data}
                                    className="m-auto"
                                />
                            </span>
                        )}

                        <span className="text-sm">
                            <ItemDate element={message.data} labelID={labelID} useTooltip />
                        </span>

                        {isUnreadMessage && <ItemUnread element={message.data} labelID={labelID} className="ml-2" />}
                    </>
                ) : (
                    <span className="message-header-metas ml-2 flex" />
                )}
            </div>
        </div>
    );
};

export default HeaderCollapsed;
