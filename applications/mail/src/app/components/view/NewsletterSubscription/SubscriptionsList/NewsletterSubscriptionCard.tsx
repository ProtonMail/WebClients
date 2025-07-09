import { useEffect, useState } from 'react';

import { ContactImage, useModalStateObject } from '@proton/components';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';
import clsx from '@proton/utils/clsx';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { SubscriptionTabs } from 'proton-mail/store/newsletterSubscriptions/interface';
import {
    isSubscriptionActiveSelector,
    selectedTab,
} from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';
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
import { PaperTrashSvg } from './PaperTrash';

import './NewsletterSubscriptionCard.scss';

const ANIMATION_DURATION = 2000;

interface Props extends PropsWithNewsletterSubscription {
    isDeleting?: boolean;
}

export const NewsletterSubscriptionCard = ({ subscription, isDeleting }: Props) => {
    const filterModal = useModalStateObject();
    const [filterType, setFilterType] = useState<ModalFilterType | null>(null);

    const dispatch = useMailDispatch();
    const isActive = useMailSelector(isSubscriptionActiveSelector(subscription.ID));
    const activeTab = useMailSelector(selectedTab);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

        if (isDeleting) {
            timeout = setTimeout(() => {
                // Removes the subscription from the active tab
                dispatch(newsletterSubscriptionsActions.removeSubscriptionFromActiveTab(subscription.ID));
                dispatch(newsletterSubscriptionsActions.unsubscribeSubscriptionAnimationEnded());
            }, ANIMATION_DURATION);
        }

        return () => {
            if (timeout) {
                // We want to remove the subscription if the component is unmounted before the animation is done
                if (isDeleting) {
                    dispatch(newsletterSubscriptionsActions.removeSubscriptionFromActiveTab(subscription.ID));
                    dispatch(newsletterSubscriptionsActions.unsubscribeSubscriptionAnimationEnded());
                }

                clearTimeout(timeout);
            }
        };
    }, [isDeleting]);

    const handleCardClick = (subscription: NewsletterSubscription) => {
        if (isDeleting) {
            return;
        }

        dispatch(newsletterSubscriptionsActions.setSelectedSubscription(subscription));
    };

    const handleFilterClick = (type: ModalFilterType) => {
        setFilterType(type);
        filterModal.openModal(true);
    };

    return (
        <>
            <div
                className={clsx(
                    'relative subscription-card-container',
                    isDeleting && 'subscription-card-container--deleted'
                )}
            >
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                <div
                    onClick={() => handleCardClick(subscription)}
                    className={clsx(
                        'subscription-card rounded-lg p-4 cursor-pointer md:p-5 border border-2 mb-4',
                        isActive ? 'border-primary' : 'shadow-norm border-transparent',
                        isDeleting && 'subscription-card--deleted'
                    )}
                    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                    tabIndex={isDeleting ? -1 : 0}
                    aria-hidden={isDeleting}
                    aria-labelledby={`subscription-card-title-${subscription.ID}`}
                    data-testid="subscription-card"
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
                            <div className="flex">
                                <div className="subscription-card-content flex-1 flex flex-nowrap gap-3 md:gap-4">
                                    <div>
                                        <SubscriptionCardTitle subscription={subscription} />
                                        <SubscriptionCardButtons
                                            subscription={subscription}
                                            handleFilterClick={handleFilterClick}
                                        />
                                    </div>
                                    {activeTab === SubscriptionTabs.Active && (
                                        <SubscriptionCardStats subscription={subscription} />
                                    )}
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
                <PaperTrashSvg className="subscription-card-trash absolute inset-0 m-auto" />
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
