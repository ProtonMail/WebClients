import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { Checkbox, type ModalProps, Prompt } from '@proton/components';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { useMailDispatch } from 'proton-mail/store/hooks';
import { filterSubscriptionList } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsActions';

import { getFilterData } from '../helper';
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

    const dispatch = useMailDispatch();

    const handleApplyFilter = () => {
        void dispatch(
            filterSubscriptionList({
                subscription,
                data: getFilterData(filterType, subscription, applyToFuture),
            })
        );

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
            <Checkbox
                checked={applyToFuture}
                onChange={() => setApplyToFuture((val) => !val)}
                className="my-2"
                id="trash"
            >
                {c('Info').t`Apply to future messages `}
            </Checkbox>
        </Prompt>
    );
};

export default ModalNewsletterSubscriptionFilter;
