import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Checkbox, Label, type ModalProps, Prompt, useNotifications } from '@proton/components';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import {
    deleteNewsletterSubscription,
    filterSubscriptionList,
} from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsActions';
import { getFilteredSubscriptionIndex } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import { getFilterData, getNewsletterCopyForFilterAction } from '../helper';
import type { ModalFilterType, PropsWithNewsletterSubscription } from '../interface';
import { useNewsletterSubscriptionTelemetry } from '../useNewsletterSubscriptionTelemetry';

interface Props extends PropsWithNewsletterSubscription, ModalProps {
    filterType: ModalFilterType;
}

const modalTitle = (filterType: ModalFilterType) => {
    switch (filterType) {
        case 'MarkAsRead':
            return c('Title').t`Mark all messages as read`;
        case 'MoveToArchive':
            return c('Title').t`Archive all messages?`;
        case 'MoveToTrash':
            return c('Title').t`Trash all messages?`;
        case 'RemoveFromList':
            return c('Title').t`Remove from list?`;
    }
};

const ctaCopy = (filterType: ModalFilterType) => {
    switch (filterType) {
        case 'MarkAsRead':
            return c('Action').t`Mark as read`;
        case 'MoveToArchive':
            return c('Action').t`Move to Archive`;
        case 'MoveToTrash':
            return c('Action').t`Move to Trash`;
        case 'RemoveFromList':
            return c('Action').t`Remove`;
    }
};

const descriptionCopy = (filterType: ModalFilterType) => {
    switch (filterType) {
        case 'MarkAsRead':
            return c('Info').t`All messages from this mailing list will be marked as read.`;
        case 'MoveToArchive':
            return c('Info').t`All messages from this mailing list will be moved to Archive.`;
        case 'MoveToTrash':
            return c('Info').t`All messages from this mailing list will be moved to Trash.`;
        case 'RemoveFromList':
            return c('Info')
                .t`This will remove the newsletter entry from this list. It will not unsubscribe you from the newsletter. It will reappear if you receive new messages.`;
    }
};

const ModalNewsletterSubscriptionFilter = ({ subscription, filterType, ...props }: Props) => {
    const [applyToFuture, setApplyToFuture] = useState(false);

    const { createNotification } = useNotifications();

    const { sendNewsletterMessagesAction } = useNewsletterSubscriptionTelemetry();

    const dispatch = useMailDispatch();
    const subscriptionIndex = useMailSelector(getFilteredSubscriptionIndex(subscription.ID));

    const handleDeleteNewsletter = () => {
        void dispatch(
            deleteNewsletterSubscription({
                subscription,
                subscriptionIndex,
            })
        );

        createNotification({
            text: getNewsletterCopyForFilterAction(filterType),
        });

        props?.onClose?.();
    };

    const handleApplyFilter = () => {
        sendNewsletterMessagesAction(filterType, applyToFuture);

        if (filterType === 'RemoveFromList') {
            handleDeleteNewsletter();
            return;
        }

        const data = getFilterData(filterType, subscription, applyToFuture);
        if (!data) {
            return;
        }

        void dispatch(
            filterSubscriptionList({
                subscription,
                subscriptionIndex,
                data,
            })
        );

        createNotification({
            text: getNewsletterCopyForFilterAction(filterType),
        });
        props?.onClose?.();
    };

    return (
        <Prompt
            {...props}
            title={modalTitle(filterType)}
            buttons={[
                <Button color="norm" onClick={handleApplyFilter}>
                    {ctaCopy(filterType)}
                </Button>,
                <Button onClick={() => props?.onClose?.()}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p className="m-0 mb-4">{descriptionCopy(filterType)}</p>
            {filterType !== 'RemoveFromList' && (
                <div className="flex flex-row items-start align-center mb-2">
                    <Checkbox
                        checked={applyToFuture}
                        onChange={() => setApplyToFuture((val) => !val)}
                        className="mr-2"
                        id="applyFuture"
                    />

                    <Label htmlFor="applyFuture" className="p-0 flex-1">{c('Info').t`Apply to future messages`}</Label>
                </div>
            )}
        </Prompt>
    );
};

export default ModalNewsletterSubscriptionFilter;
