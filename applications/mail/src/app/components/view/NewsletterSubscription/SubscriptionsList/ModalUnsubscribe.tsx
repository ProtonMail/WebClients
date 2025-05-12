import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { Checkbox, ContactImage, type ModalProps, Prompt } from '@proton/components';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import {
    filterSubscriptionList,
    unsubscribeSubscription,
} from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsActions';
import { getFilteredSubscriptionIndex } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import { getUnsubscribeData } from '../helper';

import './ModalUnsubscribe.scss';

interface Props extends ModalProps {
    subscription: NewsletterSubscription;
}

const ModalUnsubscribe = ({ subscription, ...props }: Props) => {
    const dispatch = useMailDispatch();
    const subscriptionIndex = useMailSelector(getFilteredSubscriptionIndex(subscription.ID));

    const [trash, setTrash] = useState(false);
    const [archive, setArchive] = useState(false);
    const [read, setRead] = useState(false);

    const onUnsubscribe = async () => {
        void dispatch(unsubscribeSubscription({ subscription, subscriptionIndex }));

        if (trash || archive || read) {
            await dispatch(
                filterSubscriptionList({
                    subscription,
                    subscriptionIndex,
                    data: getUnsubscribeData({ trash, archive, read }),
                })
            );
        }
        props?.onClose?.();
    };

    return (
        <Prompt
            {...props}
            title={
                <>
                    <div className="flex flex-nowrap gap-3">
                        <div className="shrink-0 subscription-card-image">
                            <ContactImage
                                email={subscription.SenderAddress}
                                name={subscription.Name}
                                variant="large"
                                className="rounded relative"
                                displaySenderImage
                            />
                        </div>
                        <div>
                            <h2 className="text-rg mb-1">{c('Title').t`Unsubscribe from ${subscription.Name}?`}</h2>
                            <p className="m-0 text-sm text-ellipsis text-normal color-weak">
                                {subscription.SenderAddress}
                            </p>
                        </div>
                    </div>
                    <hr className="mt-3 mb-2" />
                </>
            }
            buttons={[
                <Button color="norm" onClick={onUnsubscribe}>{c('Action').t`Unsubscribe`}</Button>,
                <Button onClick={() => props?.onClose?.()}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p className="m-0 mb-2 text-sm color-weak">{c('Info').t`Optional`}</p>
            <Checkbox
                checked={trash}
                disabled={archive}
                onChange={() => setTrash((val) => !val)}
                className="my-2"
                id="trash"
            >
                {c('Info').t`Trash existing messages`}
            </Checkbox>
            <Checkbox
                checked={archive}
                disabled={trash}
                onChange={() => setArchive((val) => !val)}
                className="my-2"
                id="archive"
            >
                {c('Info').t`Archive existing messages`}
            </Checkbox>
            <Checkbox checked={read} onChange={() => setRead((val) => !val)} className="mt-2" id="read">
                {c('Info').t`Mark all as read`}
            </Checkbox>
        </Prompt>
    );
};

export default ModalUnsubscribe;
