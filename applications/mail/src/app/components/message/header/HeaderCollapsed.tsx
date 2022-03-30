import {
    getHasOnlyIcsAttachments,
    hasAttachments,
    isDraft,
    isExpiring,
    isOutbox,
    isScheduled,
} from '@proton/shared/lib/mail/messages';
import { MouseEvent } from 'react';
import { c } from 'ttag';
import { classnames } from '@proton/components';
import { Label } from '@proton/shared/lib/interfaces/Label';
import ItemStar from '../../list/ItemStar';
import ItemDate from '../../list/ItemDate';
import ItemLabels from '../../list/ItemLabels';
import ItemLocation from '../../list/ItemLocation';
import ItemAttachmentIcon from '../../list/ItemAttachmentIcon';
import { Breakpoints } from '../../../models/utils';
import RecipientItem from '../recipients/RecipientItem';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { useExpiration } from '../../../hooks/useExpiration';

interface Props {
    labelID: string;
    labels?: Label[];
    message: MessageState;
    messageLoaded: boolean;
    isSentMessage: boolean;
    isUnreadMessage: boolean;
    onExpand: () => void;
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
    breakpoints,
}: Props) => {
    const { lessThanTwoHours } = useExpiration(message);

    const handleClick = (event: MouseEvent) => {
        if ((event.target as HTMLElement).closest('.stop-propagation')) {
            event.stopPropagation();
            return;
        }

        onExpand();
    };

    const isDraftMessage = isDraft(message.data) && !message.draftFlags?.sending;
    const isOutboxMessage = isOutbox(message.data) || message.draftFlags?.sending;
    const isScheduledMessage = isScheduled(message.data);
    const isExpiringMessage = isExpiring(message.data);
    const hasOnlyIcsAttachments = getHasOnlyIcsAttachments(message.data?.AttachmentInfo);

    return (
        <div
            className={classnames([
                'message-header message-header-collapsed px1-25 flex flex-nowrap flex-align-items-center cursor-pointer',
                isSentMessage ? 'is-outbound' : 'is-inbound',
                isUnreadMessage && 'is-unread',
                !messageLoaded && 'is-loading',
            ])}
            onClick={handleClick}
            data-testid={`message-header-collapsed:${message.data?.Subject}`}
        >
            <div className="flex flex-item-fluid flex-nowrap flex-align-items-center mr0-5">
                <RecipientItem
                    message={message}
                    recipientOrGroup={{ recipient: message.data?.Sender }}
                    isLoading={!messageLoaded}
                    showDropdown={false}
                    hideAddress={true}
                />

                {messageLoaded && isDraftMessage && (
                    <span className="badge-label-success ml0-5 flex-item-noshrink">{c('Info').t`Draft`}</span>
                )}
                {messageLoaded && isOutboxMessage && !isScheduledMessage && (
                    <span className="badge-label-primary ml0-5 flex-item-noshrink">{c('Info').t`Sending`}</span>
                )}
                {messageLoaded && isExpiringMessage && !lessThanTwoHours && (
                    <span className="badge-label-weak ml0-5 flex-item-noshrink">{c('Info').t`Expires`}</span>
                )}
                {messageLoaded && isExpiringMessage && lessThanTwoHours && (
                    <span className="badge-label-danger ml0-5 flex-item-noshrink">{c('Info').t`Expires soon`}</span>
                )}

                {messageLoaded && (
                    <div className="ml0-5 flex-item-fluid flex flex-nowrap">
                        <ItemLabels
                            className="no-mobile"
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
                        <span className="message-header-star mr0-5 flex">
                            <ItemStar element={message.data} />
                        </span>

                        <span className="flex">
                            <ItemLocation element={message.data} labelID={labelID} />
                        </span>

                        {!!hasAttachments(message.data) && (
                            <span className="mr0-5 flex">
                                <ItemAttachmentIcon
                                    icon={hasOnlyIcsAttachments ? 'calendar-days' : undefined}
                                    element={message.data}
                                    className="mauto"
                                />
                            </span>
                        )}

                        <span className="text-sm">
                            <ItemDate element={message.data} labelID={labelID} useTooltip />
                        </span>
                    </>
                ) : (
                    <span className="message-header-metas ml0-5 flex" />
                )}
            </div>
        </div>
    );
};

export default HeaderCollapsed;
