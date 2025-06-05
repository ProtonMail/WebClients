import { useState } from 'react';

import { ContactImage, useModalStateObject } from '@proton/components';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';
import clsx from '@proton/utils/clsx';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { isSubscriptionActiveSelector } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { newsletterSubscriptionsActions } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSlice';

import type { ModalFilterType, PropsWithNewsletterSubscription } from '../interface';
import ModalNewsletterSubscriptionFilter from './ModalNewsletterSubscriptionFilter';
import { NewsletterSubscriptionCardActiveFilter } from './NewsletterSubscriptionCardActiveFilter';
import {
    SubscriptionCardButtons,
    SubscriptionCardStats,
    SubscriptionCardTitle,
} from './NewsletterSubscriptionCardComponents';
import { NewsletterSubscriptionCardFilterDropdown } from './NewsletterSubscriptionCardFilterDropdown';

export const NewsletterSubscriptionCard = ({ subscription }: PropsWithNewsletterSubscription) => {
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
                            overrideSize={36}
                            initialsStyle={{ '--h-custom': '2.25rem' }}
                            initialsClassName="bg-strong flex h-custom items-center justify-center rounded w-full"
                        />
                    </div>
                    <div className="flex-1">
                        <div className="flex mb-3">
                            <div className="flex-1 flex gap-3 md:gap-4">
                                <div>
                                    <SubscriptionCardTitle subscription={subscription} />
                                    <SubscriptionCardButtons
                                        subscription={subscription}
                                        handleFilterClick={handleFilterClick}
                                    />
                                </div>
                                <SubscriptionCardStats subscription={subscription} />
                            </div>
                            <NewsletterSubscriptionCardFilterDropdown
                                subscription={subscription}
                                handleSubscriptionFilter={(filter) => handleFilterClick(filter)}
                            />
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
