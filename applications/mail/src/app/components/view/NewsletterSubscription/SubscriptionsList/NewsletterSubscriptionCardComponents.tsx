import type { PropsWithChildren } from 'react';

import type { IconName } from 'packages/icons';
import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import { FiltersUpsellModal, Icon, useModalStateObject } from '@proton/components';
import { useFilters } from '@proton/mail/filters/hooks';
import { MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { getUnsubscribeMethod, shouldOpenUpsellOnFilterClick } from '../helper';
import ModalUnsubscribe from './ModalUnsubscribe/ModalUnsubscribe';
import { ModalMoveToFolder } from './MoveToFolder/ModalMoveToFolder';

interface SubscriptionCardTitleProps {
    subscription: NewsletterSubscription;
}

export const SubscriptionCardTitle = ({ subscription }: SubscriptionCardTitleProps) => {
    return (
        <>
            <h3 className="text-rg text-bold mb-1 text-ellipsis" title={subscription.Name}>
                {subscription.Name}
            </h3>
            <p className="m-0 color-weak text-sm text-ellipsis" title={subscription.SenderAddress}>
                {subscription.SenderAddress}
            </p>
        </>
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

export const SubscriptionCardStats = ({ subscription }: SubscriptionCardTitleProps) => {
    return (
        <>
            {subscription.UnreadMessageCount !== undefined ? (
                <SubscriptionStat iconName="envelope-dot">
                    {c('Info').ngettext(
                        msgid`${subscription.UnreadMessageCount} unread`,
                        `${subscription.UnreadMessageCount} unread`,
                        subscription.UnreadMessageCount
                    )}
                </SubscriptionStat>
            ) : null}

            {subscription.ReceivedMessages.Last30Days !== undefined ? (
                <SubscriptionStat iconName="inbox">
                    {c('Info').ngettext(
                        msgid`${subscription.ReceivedMessages.Last30Days} email last month`,
                        `${subscription.ReceivedMessages.Last30Days} emails last month`,
                        subscription.ReceivedMessages.Last30Days
                    )}
                </SubscriptionStat>
            ) : null}
        </>
    );
};

export const ActiveSubscriptionButtons = ({ subscription }: SubscriptionCardTitleProps) => {
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
            {unsubscribeMethod && (
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        unsubscribeModal.openModal(true);
                    }}
                    shape="outline"
                    size="small"
                >{c('Action').t`Unsubscribe`}</Button>
            )}
            <Button onClick={handleMoveToFolderClick} shape="outline" size="small">{c('Action')
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
