import type { PropsWithChildren } from 'react';

import type { IconName } from 'packages/icons';
import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button, Tooltip } from '@proton/atoms';
import { FiltersUpsellModal, Icon, useModalStateObject } from '@proton/components';
import { useFilters } from '@proton/mail/filters/hooks';
import { MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { getReceivedMessagesCount, getUnsubscribeMethod, shouldOpenUpsellOnFilterClick } from '../helper';
import type { ModalFilterType, PropsWithNewsletterSubscription } from '../interface';
import ModalUnsubscribe from './ModalUnsubscribe/ModalUnsubscribe';
import { ModalMoveToFolder } from './MoveToFolder/ModalMoveToFolder';

export const SubscriptionCardTitle = ({ subscription }: PropsWithNewsletterSubscription) => {
    return (
        <div
            className="min-w-custom max-w-custom text-ellipsis mb-2"
            style={{
                '--min-w-custom': '12.5rem',
                '--max-w-custom': '12.5rem',
            }}
        >
            <h3 className="text-rg text-bold mb-1 text-ellipsis" title={subscription.Name}>
                {subscription.Name}
            </h3>
            <p className="m-0 color-weak text-sm text-ellipsis" title={subscription.SenderAddress}>
                {subscription.SenderAddress}
            </p>
        </div>
    );
};

interface SubscriptionStatProps extends PropsWithChildren {
    iconName: IconName;
}

const SubscriptionStat = ({ iconName, children }: SubscriptionStatProps) => {
    return (
        <div className="flex flex-row items-stretch flex-nowrap items-center gap-2">
            <Icon name={iconName} className="shrink-0" />
            <span>{children}</span>
        </div>
    );
};

export const SubscriptionCardStats = ({ subscription }: PropsWithNewsletterSubscription) => {
    const receivedMessagesCount = getReceivedMessagesCount(subscription);

    return (
        <div className="flex flex-column gap-2 text-sm color-weak">
            {subscription.UnreadMessageCount !== undefined ? (
                <SubscriptionStat iconName="envelope-dot">
                    {c('Info').ngettext(
                        msgid`${subscription.UnreadMessageCount} unread`,
                        `${subscription.UnreadMessageCount} unread`,
                        subscription.UnreadMessageCount
                    )}
                </SubscriptionStat>
            ) : null}

            {receivedMessagesCount !== undefined ? (
                <SubscriptionStat iconName="inbox">
                    {c('Info').ngettext(
                        msgid`${receivedMessagesCount} email last month`,
                        `${receivedMessagesCount} emails last month`,
                        receivedMessagesCount
                    )}
                </SubscriptionStat>
            ) : null}
        </div>
    );
};

const ActiveSubscriptionButtons = ({ subscription }: PropsWithNewsletterSubscription) => {
    const unsubscribeModal = useModalStateObject();
    const moveToFolderModal = useModalStateObject();
    const upsellModal = useModalStateObject();

    const [filters = []] = useFilters();
    const [user] = useUser();

    const unsubscribeMethod = getUnsubscribeMethod(subscription);

    const handleMoveToFolderClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (shouldOpenUpsellOnFilterClick(subscription, user, filters)) {
            upsellModal.openModal(true);
        } else {
            moveToFolderModal.openModal(true);
        }
    };

    return (
        <>
            <Button
                disabled={!unsubscribeMethod}
                onClick={(e) => {
                    e.stopPropagation();
                    unsubscribeModal.openModal(true);
                }}
                shape="outline"
                size="tiny"
            >{c('Action').t`Unsubscribe`}</Button>

            {!unsubscribeMethod && (
                <Tooltip
                    title={
                        unsubscribeMethod
                            ? null
                            : c('Info')
                                  .t`We couldn't find an unsubscribe option for this newsletter. You may be able to unsubscribe using a link in their email or from their website.`
                    }
                >
                    <Icon name="info-circle" className="color-weak" />
                </Tooltip>
            )}

            <Button onClick={handleMoveToFolderClick} shape="outline" size="tiny">{c('Action')
                .t`Move to folder`}</Button>

            {subscription && unsubscribeModal.render && (
                <ModalUnsubscribe subscription={subscription} {...unsubscribeModal.modalProps} />
            )}
            {subscription && moveToFolderModal.render && (
                <ModalMoveToFolder subscription={subscription} {...moveToFolderModal.modalProps} />
            )}

            {upsellModal.render && (
                <FiltersUpsellModal
                    modalProps={upsellModal.modalProps}
                    overrideFeature={MAIL_UPSELL_PATHS.UNLIMITED_FILTERS_MAIL_SUBSCRIPTION}
                />
            )}
        </>
    );
};

const InactiveSubscriptionButtons = ({ handleFilterClick }: { handleFilterClick: (type: ModalFilterType) => void }) => {
    return (
        <Button
            onClick={() => handleFilterClick('MoveToTrash')}
            shape="outline"
            size="tiny"
            className="color-danger"
        >{c('Action').t`Move to Trash`}</Button>
    );
};

export const SubscriptionCardButtons = ({
    subscription,
    handleFilterClick,
}: PropsWithNewsletterSubscription & { handleFilterClick: (type: ModalFilterType) => void }) => {
    return (
        <div className="flex items-center gap-2">
            {subscription.UnsubscribedTime ? (
                <InactiveSubscriptionButtons handleFilterClick={handleFilterClick} />
            ) : (
                <ActiveSubscriptionButtons subscription={subscription} />
            )}
        </div>
    );
};
