import type { PropsWithChildren } from 'react';

import type { IconName } from 'packages/icons';
import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import { FiltersUpsellModal, Icon, LabelsUpsellModal, useModalStateObject } from '@proton/components';
import { useFilters } from '@proton/mail/store/filters/hooks';
import { MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { useMailSelector } from 'proton-mail/store/hooks';
import { SubscriptionTabs } from 'proton-mail/store/newsletterSubscriptions/interface';
import { selectedTab } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import { getReceivedMessagesCount, getUnsubscribeMethod, shouldOpenUpsellOnFilterClick } from '../helper';
import type { ModalFilterType, PropsWithNewsletterSubscription } from '../interface';
import { ModalBlockSender } from './ModalBlockSender/ModalBlockSender';
import ModalUnsubscribe from './ModalUnsubscribe/ModalUnsubscribe';
import { ModalMoveToFolder } from './MoveToFolder/ModalMoveToFolder';

export const SubscriptionCardTitle = ({ subscription }: PropsWithNewsletterSubscription) => {
    return (
        <div className="subscription-card-title w-custom max-w-full">
            <h3
                className="text-rg text-bold mb-1 text-ellipsis"
                title={subscription.Name}
                id={`subscription-card-title-${subscription.ID}`}
            >
                {subscription.Name}
            </h3>
            <p className="m-0 color-weak text-sm text-ellipsis max-w-full" title={subscription.SenderAddress}>
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
    const blockSenderModal = useModalStateObject();
    const moveToFolderModal = useModalStateObject();

    const filterUpsellModal = useModalStateObject();
    const moveToFolderUpsellModal = useModalStateObject();

    const [filters = []] = useFilters();
    const [user] = useUser();

    const unsubscribeMethod = getUnsubscribeMethod(subscription);

    const handleMoveToFolderClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (shouldOpenUpsellOnFilterClick(subscription, user, filters)) {
            filterUpsellModal.openModal(true);
        } else {
            moveToFolderModal.openModal(true);
        }
    };

    const handleUnsubscribeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (unsubscribeMethod) {
            unsubscribeModal.openModal(true);
        } else {
            blockSenderModal.openModal(true);
        }
    };

    const handleMoveToFolderUpsell = () => {
        moveToFolderUpsellModal.openModal(true);
    };

    return (
        <>
            <Button onClick={handleUnsubscribeClick} shape="outline" size="tiny">{c('Action').t`Unsubscribe`}</Button>

            <Button onClick={handleMoveToFolderClick} shape="outline" size="tiny">{c('Action')
                .t`Move to folder`}</Button>

            {subscription && unsubscribeModal.render && (
                <ModalUnsubscribe subscription={subscription} {...unsubscribeModal.modalProps} />
            )}
            {subscription && moveToFolderModal.render && (
                <ModalMoveToFolder
                    subscription={subscription}
                    handleUpsellModalDisplay={handleMoveToFolderUpsell}
                    {...moveToFolderModal.modalProps}
                />
            )}

            {subscription && blockSenderModal.render && (
                <ModalBlockSender subscription={subscription} {...blockSenderModal.modalProps} />
            )}

            {filterUpsellModal.render && (
                <FiltersUpsellModal
                    modalProps={filterUpsellModal.modalProps}
                    overrideFeature={MAIL_UPSELL_PATHS.UNLIMITED_FILTERS_NEWSLETTER_SUBSCRIPTION}
                />
            )}

            {moveToFolderUpsellModal.render && (
                <LabelsUpsellModal
                    modalProps={moveToFolderUpsellModal.modalProps}
                    feature={MAIL_UPSELL_PATHS.UNLIMITED_FOLDERS_NEWSLETTER_SUBSCRIPTION}
                />
            )}
        </>
    );
};

const UnsubscribedSubscriptionButtons = ({
    handleFilterClick,
}: {
    handleFilterClick: (type: ModalFilterType) => void;
}) => {
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
    const currentTab = useMailSelector(selectedTab);

    return (
        <div className="flex items-center gap-2 mt-2">
            {currentTab === SubscriptionTabs.Unsubscribe ? (
                <UnsubscribedSubscriptionButtons handleFilterClick={handleFilterClick} />
            ) : (
                <ActiveSubscriptionButtons subscription={subscription} />
            )}
        </div>
    );
};
