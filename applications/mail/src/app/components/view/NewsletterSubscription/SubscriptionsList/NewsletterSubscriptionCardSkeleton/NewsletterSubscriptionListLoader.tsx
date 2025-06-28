import range from '@proton/utils/range';

import { useMailSelector } from 'proton-mail/store/hooks';
import { selectSubscriptionsCount } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import { NewsletterSubscriptionListWrapper } from '../NewsletterSubscriptionListWrapper';
import { NewsletterSubscriptionCardSkeleton } from './NewsletterSubscriptionCardSkeleton';

const DEFAULT_SKELETON_COUNT = 3;

export const NewsletterSubscriptionListLoader = () => {
    const count = useMailSelector(selectSubscriptionsCount);
    const scale = range(0, count.active === 0 ? DEFAULT_SKELETON_COUNT : count.active);

    return (
        <NewsletterSubscriptionListWrapper>
            {scale.map((index) => (
                <NewsletterSubscriptionCardSkeleton key={index} />
            ))}
        </NewsletterSubscriptionListWrapper>
    );
};
