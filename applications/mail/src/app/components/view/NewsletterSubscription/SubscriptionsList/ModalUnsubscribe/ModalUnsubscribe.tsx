import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    ContactImage,
    LinkConfirmationModal,
    type ModalProps,
    Prompt,
    useModalStateObject,
    useNotifications,
} from '@proton/components';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { CONFIRM_LINK } from '@proton/shared/lib/mail/mailSettings';
import truncate from '@proton/utils/truncate';

import useMailModel from 'proton-mail/hooks/useMailModel';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import {
    filterSubscriptionList,
    unsubscribeSubscription,
    updateSubscription,
} from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsActions';
import { getFilteredSubscriptionIndex } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

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
    const mailSettings = useMailModel('MailSettings');

    const dispatch = useMailDispatch();
    const subscriptionIndex = useMailSelector(getFilteredSubscriptionIndex(subscription.ID));

    const { sendUnsubscribeEmail } = useSendUnsubscribeEmail({ subscription });

    const unsubscribeMethod = getUnsubscribeMethod(subscription);
    const { sendNewsletterAction } = useNewsletterSubscriptionTelemetry();

    const linkConfirmationModal = useModalStateObject();
    // Change this once the backend return the value in the subscription
    const isPhisingOrSuspicious = false;

    const [checkboxes, setCheckboxes] = useState<Record<string, boolean>>({
        trash: false,
        archive: false,
        read: false,
    });

    const { createNotification } = useNotifications();

    const updateNewsletterAfterUnsubscribe = () => {
        void dispatch(updateSubscription({ subscription, subscriptionIndex, data: { Unsubscribed: true } }));
        props?.onClose?.();
    };

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
                text: c('Label').t`Unsubscribed from ${truncatedName}.`,
            });
        } else {
            if (unsubscribeMethod === UnsubscribeMethod.HttpClient) {
                const askForLinkConfirmation = mailSettings?.ConfirmLink ?? CONFIRM_LINK.CONFIRM;

                if (askForLinkConfirmation || isPhisingOrSuspicious) {
                    linkConfirmationModal.openModal(true);
                } else {
                    openNewTab(subscription.UnsubscribeMethods.HttpClient!);
                    updateNewsletterAfterUnsubscribe();
                }
            } else if (unsubscribeMethod === UnsubscribeMethod.Mailto) {
                void sendUnsubscribeEmail();
                updateNewsletterAfterUnsubscribe();
            }
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
            props?.onClose?.();
        }
    };

    return (
        <>
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

            {linkConfirmationModal.render && (
                <LinkConfirmationModal
                    link={subscription.UnsubscribeMethods.HttpClient}
                    isPhishingAttempt={isPhisingOrSuspicious}
                    onConfirm={() => {
                        updateNewsletterAfterUnsubscribe();
                    }}
                    {...linkConfirmationModal.modalProps}
                />
            )}
        </>
    );
};

export default ModalUnsubscribe;
