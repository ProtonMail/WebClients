import {
    getHasOnlyIcsAttachments,
    hasAttachments,
    isDraft,
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
import ItemExpiration from '../../list/ItemExpiration';
import ItemAction from '../../list/ItemAction';
import { Breakpoints } from '../../../models/utils';
import RecipientItem from '../recipients/RecipientItem';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    labelID: string;
    labels?: Label[];
    message: MessageState;
    messageLoaded: boolean;
    isSentMessage: boolean;
    isUnreadMessage: boolean;
    onExpand: () => void;
    breakpoints: Breakpoints;
    highlightKeywords?: boolean;
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
    highlightKeywords = false,
}: Props) => {
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
    const hasOnlyIcsAttachments = getHasOnlyIcsAttachments(message.data?.AttachmentInfo);

    return (
        <div
            className={classnames([
                'message-header message-header-collapsed flex flex-nowrap flex-align-items-center cursor-pointer',
                isSentMessage ? 'is-outbound' : 'is-inbound',
                isUnreadMessage && 'is-unread',
                !messageLoaded && 'is-loading',
            ])}
            onClick={handleClick}
            data-testid={`message-header-collapsed:${message.data?.Subject}`}
        >
            <div className="flex flex-item-fluid flex-nowrap flex-align-items-center mr0-5">
                <RecipientItem
                    recipientOrGroup={{ recipient: message.data?.Sender }}
                    showAddress={false}
                    isLoading={!messageLoaded}
                    highlightKeywords={highlightKeywords}
                />

                {messageLoaded && (
                    <ItemAction element={message.data} className="flex-item-noshrink mtauto mbauto ml0-25" />
                )}

                {messageLoaded && isDraftMessage && (
                    <span className="badge-label-success ml0-5 flex-item-noshrink">{c('Info').t`Draft`}</span>
                )}
                {messageLoaded && isOutboxMessage && !isScheduledMessage && (
                    <span className="badge-label-primary ml0-5 flex-item-noshrink">{c('Info').t`Sending`}</span>
                )}
                {messageLoaded && isScheduledMessage && (
                    <span className="badge-label-primary ml0-5 flex-item-noshrink">{c('Info').t`Scheduled`}</span>
                )}
            </div>
            <div className="flex flex-align-items-center flex-nowrap flex-item-noshrink">
                {messageLoaded ? (
                    <>
                        <ItemLabels
                            className="no-mobile"
                            element={message.data}
                            labels={labels}
                            labelID={labelID}
                            showUnlabel
                            maxNumber={breakpoints.isTablet ? 1 : 5}
                            data-testid="message-header-collapsed:labels"
                        />

                        {!!hasAttachments(message.data) && (
                            <span className="ml0-5 flex">
                                <ItemAttachmentIcon
                                    icon={hasOnlyIcsAttachments ? 'calendar-days' : undefined}
                                    element={message.data}
                                    className="mauto"
                                />
                            </span>
                        )}

                        <span className="ml0-5 flex">
                            <ItemLocation element={message.data} labelID={labelID} />
                        </span>

                        <ItemExpiration element={message.data} className="flex flex-item-noshrink ml0-25 mr0-25" />

                        <ItemDate className="ml0-5" element={message.data} labelID={labelID} />
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
