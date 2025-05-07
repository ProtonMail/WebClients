import { useMailSelector } from 'proton-mail/store/hooks';
import { filteredSubscriptionList } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import { NewsletterSubscriptionCard } from './NewsletterSubscriptionCard';
import { NewsletterSubscriptionListPlaceholder } from './NewsletterSubscriptionListPlaceholder';
import { NewsletterSubscriptionListWrapper } from './NewsletterSubscriptionListWrapper';

export const NewsletterSubscriptionList = () => {
    const filteredSubscriptions = useMailSelector(filteredSubscriptionList);

    return (
        <NewsletterSubscriptionListWrapper>
            {filteredSubscriptions.length === 0 ? (
                <NewsletterSubscriptionListPlaceholder />
            ) : (
                filteredSubscriptions.map((sub) => <NewsletterSubscriptionCard key={sub.ID} subscription={sub} />)
            )}
        </NewsletterSubscriptionListWrapper>
    );
};
