import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ContactImage, type ModalProps, NotificationButton, Prompt, useNotifications } from '@proton/components';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import truncate from '@proton/utils/truncate';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { SubscriptionTabs } from 'proton-mail/store/newsletterSubscriptions/interface';
import {
    filterSubscriptionList,
    unsubscribeSubscription,
    updateSubscription,
} from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsActions';
import { getFilteredSubscriptionIndex } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { newsletterSubscriptionsActions } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSlice';

import { getUnsubscribeData, getUnsubscribeMethod } from '../../helper';
import {
    MAX_LENGTH_SUB_NAME,
    NewsletterSubscriptionAction,
    type PropsWithNewsletterSubscription,
    UnsubscribeMethod,
} from '../../interface';
import { useNewsletterSubscriptionTelemetry } from '../../useNewsletterSubscriptionTelemetry';
import { ModalSharedCheckboxes } from '../ModalBlockSender/ModalSharedComponents';
import { ModalUnsubscribeMailToContent } from './ModalUnsubscribeMailToContent';
import { useSendUnsubscribeEmail } from './useSendUnsubscribeEmail';

const ModalUnsubscribe = ({ subscription, ...props }: PropsWithNewsletterSubscription & ModalProps) => {
    const dispatch = useMailDispatch();
    const subscriptionIndex = useMailSelector(getFilteredSubscriptionIndex(subscription.ID));

    const { sendUnsubscribeEmail } = useSendUnsubscribeEmail({ subscription });

    const unsubscribeMethod = getUnsubscribeMethod(subscription);
    const { sendNewsletterAction } = useNewsletterSubscriptionTelemetry();

    const [checkboxes, setCheckboxes] = useState<Record<string, boolean>>({
        trash: false,
        archive: false,
        read: false,
    });

    const { createNotification } = useNotifications();

    const onUnsubscribe = async () => {
        sendNewsletterAction({
            newsletterAction: NewsletterSubscriptionAction.unsubscribe,
            markAsRead: checkboxes.read,
            moveToTrash: checkboxes.trash,
            moveToArchive: checkboxes.archive,
        });

        if (unsubscribeMethod === UnsubscribeMethod.OneClick) {
            void dispatch(unsubscribeSubscription({ subscription, subscriptionIndex }));

            const truncatedName = truncate(subscription.Name.trim(), MAX_LENGTH_SUB_NAME);
            createNotification({
                text: (
                    <>
                        <span>{c('Label').t`Unsubscribed from ${truncatedName}.`}</span>
                        <NotificationButton
                            onClick={() => {
                                dispatch(newsletterSubscriptionsActions.setSelectedTab(SubscriptionTabs.Unsubscribe));
                            }}
                        >{c('Action').t`Undo`}</NotificationButton>
                    </>
                ),
            });
        } else {
            if (unsubscribeMethod === UnsubscribeMethod.HttpClient) {
                // We know the http client link is present thanks to the unsubscribeMethod
                openNewTab(subscription.UnsubscribeMethods.HttpClient!);
            } else if (unsubscribeMethod === UnsubscribeMethod.Mailto) {
                void sendUnsubscribeEmail();
            }

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
            title={
                <>
                    <div className="flex flex-nowrap gap-3">
                        <div className="shrink-0 w-custom" style={{ '--w-custom': '2.25rem' }}>
                            <ContactImage
                                email={subscription.SenderAddress}
                                name={subscription.Name}
                                variant="large"
                                className="rounded relative"
                                displaySenderImage
                                initialsStyle={{ '--h-custom': '2.25rem' }}
                                initialsClassName="bg-strong text-no-bold flex h-custom items-center justify-center rounded w-full"
                                overrideSize={36}
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
                <Button color="norm" onClick={onUnsubscribe} data-testid="unsubscribe-button">
                    {unsubscribeMethod === UnsubscribeMethod.Mailto
                        ? c('Action').t`Send unsubscribe email`
                        : c('Action').t`Unsubscribe`}
                </Button>,
                <Button onClick={() => props?.onClose?.()}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <ModalUnsubscribeMailToContent subscription={subscription} />
            <p className="m-0 mb-2 text-sm color-weak">{c('Info').t`Optional`}</p>

            <ModalSharedCheckboxes checkboxes={checkboxes} setCheckboxes={setCheckboxes} />
        </Prompt>
    );
};

export default ModalUnsubscribe;
