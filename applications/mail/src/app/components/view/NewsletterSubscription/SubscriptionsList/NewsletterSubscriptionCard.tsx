import { useState } from 'react';

import { ContactImage, useModalStateObject } from '@proton/components';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';
import clsx from '@proton/utils/clsx';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { isSubscriptionActiveSelector } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { newsletterSubscriptionsActions } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSlice';

import type { ModalFilterType } from '../interface';
import ModalNewsletterSubscriptionFilter from './ModalNewsletterSubscriptionFilter';
import { NewsletterSubscriptionCardActiveFilter } from './NewsletterSubscriptionCardActiveFilter';
import {
    ActiveSubscriptionButtons,
    InactiveSubscriptionButtons,
    SubscriptionCardStats,
    SubscriptionCardTitle,
} from './NewsletterSubscriptionCardComponents';
import { NewsletterSubscriptionCardFilterDropdown } from './NewsletterSubscriptionCardFilterDropdown';

interface Props {
    subscription: NewsletterSubscription;
}

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
                    'subscription-card rounded-lg p-4 cursor-pointer md:p-5 border border-2',
                    isActive ? 'border-primary' : 'shadow-norm border-transparent'
                )}
            >
                <div className="flex gap-3 md:gap-4">
                    <div className="subscription-card-image shrink-0">
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
                    <div className="flex-1">
                        <div className="flex mb-3">
                            <div className="flex-1 flex gap-3 md:gap-4">
                                <div
                                    className="min-w-custom max-w-custom text-ellipsis"
                                    style={{
                                        '--min-w-custom': '12.5rem',
                                        '--max-w-custom': '12.5rem',
                                    }}
                                >
                                    <SubscriptionCardTitle subscription={subscription} />
                                </div>
                                <div className="flex flex-column gap-2 text-sm color-weak">
                                    <SubscriptionCardStats subscription={subscription} />
                                </div>
                            </div>
                            <NewsletterSubscriptionCardFilterDropdown
                                subscription={subscription}
                                handleSubscriptionFilter={(filter) => handleFilterClick(filter)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {subscription.UnsubscribedTime ? (
                                <InactiveSubscriptionButtons onMoveToTrash={() => handleFilterClick('MoveToTrash')} />
                            ) : (
                                <ActiveSubscriptionButtons subscription={subscription} />
                            )}
                        </div>
                        <NewsletterSubscriptionCardActiveFilter subscription={subscription} />
                    </div>
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
