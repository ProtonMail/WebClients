import type { PropsWithChildren } from 'react';
import { useState } from 'react';

import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button, ButtonLike } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { ContactImage, FiltersUpsellModal, Icon, useModalStateObject } from '@proton/components';
import { useFilters } from '@proton/mail/filters/hooks';
import { MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';
import clsx from '@proton/utils/clsx';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { isSubscriptionActiveSelector } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { newsletterSubscriptionsActions } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSlice';

import { shouldOpenUpsellOnFilterClick } from '../helper';
import type { ModalFilterType } from '../interface';
import ModalNewsletterSubscriptionFilter from './ModalNewsletterSubscriptionFilter';
import ModalUnsubscribe from './ModalUnsubscribe';
import { ModalMoveToFolder } from './MoveToFolder/ModalMoveToFolder';
import { NewsletterSubscriptionCardActiveFilter } from './NewsletterSubscriptionCardActiveFilter';
import { NewsletterSubscriptionCardFilterDropdown } from './NewsletterSubscriptionCardFilterDropdown';

interface Props {
    subscription: NewsletterSubscription;
}

const ActiveSubscriptionButtons = ({ subscription }: Pick<Props, 'subscription'>) => {
    const unsubscribeModal = useModalStateObject();
    const moveToFolderModal = useModalStateObject();
    const upsellModal = useModalStateObject();

    const [filters = []] = useFilters();
    const [user] = useUser();

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
                onClick={(e) => {
                    e.stopPropagation();
                    unsubscribeModal.openModal(true);
                }}
                shape="outline"
                size="small"
            >{c('Action').t`Unsubscribe`}</Button>
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

interface InactiveSubscriptionButtonsProps {
    onMoveToTrash: () => void;
}

const InactiveSubscriptionButtons = ({ onMoveToTrash }: InactiveSubscriptionButtonsProps) => {
    return (
        <>
            <ButtonLike as="a" href="#" target="_blank" shape="outline" size="small" className="flex items-center">
                <Icon name="arrow-out-square" className="mr-1" />
                {c('Action').t`Resubscribe`}
            </ButtonLike>
            <Button onClick={onMoveToTrash} shape="outline" size="small" className="color-danger">{c('Action')
                .t`Move to trash`}</Button>
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

export const NewsletterSubscriptionCard = ({ subscription }: Props) => {
    const filterModal = useModalStateObject();
    const [filterType, setFilterType] = useState<ModalFilterType | null>(null);

    const dispatch = useMailDispatch();
    const isActive = useMailSelector(isSubscriptionActiveSelector(subscription.ID));

    const handleCardClick = (subscription: NewsletterSubscription) => {
        dispatch(newsletterSubscriptionsActions.setSelectedSubscription(subscription));
    };

    const handleFilterClick = (type: ModalFilterType) => {
        setFilterType(type);
        filterModal.openModal(true);
    };

    return (
        <>
            <div
                onClick={() => handleCardClick(subscription)}
                className={clsx(
                    'rounded-lg p-4 min-h-fit-content subscription-card cursor-pointer md:p-5 border border-2',
                    isActive ? 'border-primary' : 'shadow-norm border-transparent'
                )}
            >
                <div className="flex flex-nowrap shrink-0 gap-3 md:gap-4">
                    <div className="shrink-0 subscription-card-image">
                        <ContactImage
                            email={subscription.SenderAddress}
                            name={subscription.Name}
                            variant="large"
                            className="rounded relative"
                            displaySenderImage
                            initialsStyle={{ '--h-custom': '2.25rem' }}
                            initialsClassName="bg-strong flex h-custom items-center justify-center rounded w-full"
                        />
                    </div>
                    <div className="flex flex-column text-left gap-2 w-full md:gap-4 md:flex-row">
                        <div className="max-w-full flex-1">
                            <h3 className="text-rg text-bold mb-1 text-ellipsis" title={subscription.Name}>
                                {subscription.Name}
                            </h3>
                            <p className="m-0 color-weak text-sm text-ellipsis" title={subscription.SenderAddress}>
                                {subscription.SenderAddress}
                            </p>
                        </div>
                        <div className="flex flex-1 flex-column gap-3 text-sm color-weak">
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
                        </div>
                    </div>
                    <NewsletterSubscriptionCardFilterDropdown
                        subscription={subscription}
                        handleSubscriptionFilter={(filter) => handleFilterClick(filter)}
                    />
                </div>
                <div className="mt-2 flex gap-2 md:mt-3">
                    <div className="hidden sm:block subscription-card-image" />
                    {subscription.UnsubscribedTime ? (
                        <InactiveSubscriptionButtons onMoveToTrash={() => handleFilterClick('MoveToTrash')} />
                    ) : (
                        <ActiveSubscriptionButtons subscription={subscription} />
                    )}
                </div>
                <div className="flex gap-3">
                    <div className="hidden sm:block subscription-card-image" />
                    <NewsletterSubscriptionCardActiveFilter subscription={subscription} />
                </div>
            </div>

            {filterType && filterModal.render && (
                <ModalNewsletterSubscriptionFilter
                    subscription={subscription}
                    filterType={filterType}
                    {...filterModal.modalProps}
                />
            )}
        </>
    );
};
