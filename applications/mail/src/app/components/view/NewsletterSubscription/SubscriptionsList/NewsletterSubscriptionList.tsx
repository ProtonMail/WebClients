import { useMailSelector } from 'proton-mail/store/hooks';
import { selectTabSubscriptionsList } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import { NewsletterSubscriptionCard } from './NewsletterSubscriptionCard';
import { NewsletterSubscriptionListPlaceholder } from './NewsletterSubscriptionListPlaceholder';
import { NewsletterSubscriptionListWrapper } from './NewsletterSubscriptionListWrapper';

export const NewsletterSubscriptionList = () => {
    const subscriptionList = useMailSelector(selectTabSubscriptionsList);

    return (
        <NewsletterSubscriptionListWrapper>
            {subscriptionList.length === 0 ? (
                <NewsletterSubscriptionListPlaceholder />
            ) : (
                subscriptionList.map((sub) => <NewsletterSubscriptionCard key={sub.ID} subscription={sub} />)
            )}
        </NewsletterSubscriptionListWrapper>
    );
};
