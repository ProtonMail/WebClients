import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Checkbox, Label, type ModalProps, Prompt, useNotifications } from '@proton/components';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { filterSubscriptionList } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsActions';
import { getFilteredSubscriptionIndex } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import { getFilterData, getNewsletterCopyForFilterAction } from '../helper';
import type { ModalFilterType } from '../interface';

interface Props extends ModalProps {
    subscription: NewsletterSubscription;
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
    }
};

const ctaCopy = (filterType: ModalFilterType) => {
    switch (filterType) {
        case 'MarkAsRead':
            return c('Action').t`Mark as read`;
        case 'MoveToArchive':
            return c('Action').t`Move to archive`;
        case 'MoveToTrash':
            return c('Action').t`Move to trash`;
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
    }
};

const ModalNewsletterSubscriptionFilter = ({ subscription, filterType, ...props }: Props) => {
    const [applyToFuture, setApplyToFuture] = useState(false);

    const { createNotification } = useNotifications();

    const dispatch = useMailDispatch();
    const subscriptionIndex = useMailSelector(getFilteredSubscriptionIndex(subscription.ID));

    const handleApplyFilter = () => {
        void dispatch(
            filterSubscriptionList({
                subscription,
                subscriptionIndex,
                data: getFilterData(filterType, subscription, applyToFuture),
            })
        );

        createNotification({
            // TODO add undo actions once the API returns a undo token
            text: getNewsletterCopyForFilterAction(subscription, filterType),
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
            <div className="flex flex-row items-start align-center mb-2">
                <Checkbox
                    checked={applyToFuture}
                    onChange={() => setApplyToFuture((val) => !val)}
                    className="mr-2"
                    id="applyFuture"
                />

                <Label htmlFor="applyFuture" className="p-0 flex-1">{c('Info').t`Apply to future messages`}</Label>
            </div>
        </Prompt>
    );
};

export default ModalNewsletterSubscriptionFilter;
