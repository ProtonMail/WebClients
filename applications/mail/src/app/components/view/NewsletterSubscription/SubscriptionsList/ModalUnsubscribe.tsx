import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Checkbox,
    ContactImage,
    Label,
    type ModalProps,
    NotificationButton,
    Prompt,
    useNotifications,
} from '@proton/components';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';
import truncate from '@proton/utils/truncate';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { SubscriptionTabs } from 'proton-mail/store/newsletterSubscriptions/interface';
import {
    filterSubscriptionList,
    unsubscribeSubscription,
} from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsActions';
import { getFilteredSubscriptionIndex } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { newsletterSubscriptionsActions } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSlice';

import { getUnsubscribeData } from '../helper';
import { MAX_LENGTH_SUB_NAME } from '../interface';

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

    const { createNotification } = useNotifications();

    const onUnsubscribe = async () => {
        void dispatch(unsubscribeSubscription({ subscription, subscriptionIndex }));

        const truncatedName = truncate(subscription.Name.trim(), MAX_LENGTH_SUB_NAME);
        createNotification({
            text: (
                <>
                    <span>{c('Label').t`Unsubscribed from ${truncatedName}.`}</span>
                    <NotificationButton
                        onClick={() => {
                            // TODO update this to a undo action once API returns undo token
                            dispatch(newsletterSubscriptionsActions.setSelectedTab(SubscriptionTabs.Unsubscribe));
                        }}
                    >{c('Action').t`Undo`}</NotificationButton>
                </>
            ),
        });

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

            <div className="flex flex-row items-start align-center mb-2">
                <Checkbox
                    checked={trash}
                    onChange={() => {
                        setTrash((val) => !val);
                        setArchive(false);
                    }}
                    className="mr-2"
                    id="trash"
                />
                <Label htmlFor="trash" className="p-0 flex-1">{c('Info').t`Trash existing messages`}</Label>
            </div>

            <div className="flex flex-row items-start align-center mb-2">
                <Checkbox
                    checked={archive}
                    onChange={() => {
                        setArchive((val) => !val);
                        setTrash(false);
                    }}
                    className="mr-2"
                    id="archive"
                />

                <Label htmlFor="archive" className="p-0 flex-1">{c('Info').t`Archive existing messages`}</Label>
            </div>

            <div className="flex flex-row items-start align-center mb-2">
                <Checkbox checked={read} onChange={() => setRead((val) => !val)} className="mr-2" id="read" />
                <Label htmlFor="read" className="p-0 flex-1">{c('Info').t`Mark all as read`}</Label>
            </div>
        </Prompt>
    );
};

export default ModalUnsubscribe;
