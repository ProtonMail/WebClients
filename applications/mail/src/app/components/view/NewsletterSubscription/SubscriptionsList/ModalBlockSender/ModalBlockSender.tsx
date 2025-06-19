import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { type ModalProps, Prompt, useNotifications } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { addBlockAddresses } from 'proton-mail/store/incomingDefaults/incomingDefaultsActions';
import {
    filterSubscriptionList,
    updateSubscription,
} from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsActions';
import { getFilteredSubscriptionIndex } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import { getUnsubscribeData } from '../../helper';
import { NewsletterSubscriptionAction, type PropsWithNewsletterSubscription } from '../../interface';
import { useNewsletterSubscriptionTelemetry } from '../../useNewsletterSubscriptionTelemetry';
import { ModalCheckboxWithLabel, ModalSharedCheckboxes } from './ModalSharedComponents';

export const ModalBlockSender = ({ subscription, ...props }: PropsWithNewsletterSubscription & ModalProps) => {
    const dispatch = useMailDispatch();
    const subscriptionIndex = useMailSelector(getFilteredSubscriptionIndex(subscription.ID));

    const { sendNewsletterAction } = useNewsletterSubscriptionTelemetry();

    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const [checkboxes, setCheckboxes] = useState<Record<string, boolean>>({
        trash: false,
        archive: false,
        read: false,
        block: false,
        applyToFuture: false,
    });

    const onBlockSender = async () => {
        if (checkboxes.block) {
            sendNewsletterAction({
                newsletterAction: NewsletterSubscriptionAction.blockSender,
                applyToFuture: checkboxes.applyToFuture,
                markAsRead: checkboxes.read,
                moveToTrash: checkboxes.trash,
                moveToArchive: checkboxes.archive,
            });

            await dispatch(addBlockAddresses({ addresses: [subscription.SenderAddress], overwrite: true }));
            createNotification({
                text: c('Info').t`Preferences updated`,
            });

            void dispatch(updateSubscription({ subscription, subscriptionIndex, data: { Unsubscribed: true } }));
        }

        if (checkboxes.trash || checkboxes.archive || checkboxes.read) {
            await dispatch(
                filterSubscriptionList({
                    subscription,
                    subscriptionIndex,
                    data: getUnsubscribeData({
                        trash: checkboxes.trash,
                        archive: checkboxes.archive,
                        read: checkboxes.read,
                    }),
                })
            );
        }

        props?.onClose?.();
    };

    return (
        <Prompt
            {...props}
            title={c('Title').t`Unsubscribe not available for this sender`}
            buttons={[
                <Button color="norm" onClick={() => withLoading(onBlockSender())} loading={loading}>
                    {c('Action').t`Done`}
                </Button>,
                <Button onClick={() => props?.onClose?.()} disabled={loading}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p className="m-0 mb-3 text-sm color-weak text-ellipsis">{subscription.SenderAddress}</p>
            <hr className="bg-weak" />
            <p className="m-0 mb-4 text-sm color-weak">{c('Label').t`Choose what to do instead`}</p>

            <ModalSharedCheckboxes checkboxes={checkboxes} setCheckboxes={setCheckboxes} />

            <hr className="bg-weak" />

            <ModalCheckboxWithLabel
                label={c('Info').t`Block sender`}
                id="block"
                checked={checkboxes.block}
                onChange={() => {
                    setCheckboxes((prev) => ({
                        ...prev,
                        block: !prev.block,
                    }));
                }}
            />

            <ModalCheckboxWithLabel
                label={c('Info').t`Apply to future messages`}
                id="applyFuture"
                checked={checkboxes.applyToFuture}
                onChange={() => {
                    setCheckboxes((prev) => ({
                        ...prev,
                        applyToFuture: !prev.applyToFuture,
                    }));
                }}
                disabled={checkboxes.block}
                labelClassName={checkboxes.block ? 'color-weak' : ''}
            />
        </Prompt>
    );
};
