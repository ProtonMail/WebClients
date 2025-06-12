import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useLoading from '@proton/hooks/useLoading';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { fetchNextNewsletterSubscriptionsPage } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsActions';
import {
    deletingSubscriptionIdSelector,
    selectTabSubscriptionPagination,
    selectTabSubscriptionsList,
} from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import { NewsletterSubscriptionCard } from './NewsletterSubscriptionCard';
import { NewsletterSubscriptionListPlaceholder } from './NewsletterSubscriptionListPlaceholder';
import { NewsletterSubscriptionListWrapper } from './NewsletterSubscriptionListWrapper';

export const NewsletterSubscriptionList = () => {
    const dispatch = useMailDispatch();

    const subscriptionList = useMailSelector(selectTabSubscriptionsList);
    const pagination = useMailSelector(selectTabSubscriptionPagination);
    const deletingSubscriptionId = useMailSelector(deletingSubscriptionIdSelector);

    const [loading, withLoading] = useLoading();

    const handleNextPageClick = () => {
        void withLoading(dispatch(fetchNextNewsletterSubscriptionsPage()));
    };

    return (
        <NewsletterSubscriptionListWrapper isDisplayingPlaceholder={subscriptionList.length === 0}>
            {subscriptionList.length === 0 ? (
                <NewsletterSubscriptionListPlaceholder />
            ) : (
                <>
                    {subscriptionList.map((sub) => (
                        <NewsletterSubscriptionCard
                            key={sub.ID}
                            subscription={sub}
                            isDeleting={deletingSubscriptionId === sub.ID}
                        />
                    ))}
                    {pagination ? (
                        <Button className="w-fit-content mx-auto" loading={loading} onClick={handleNextPageClick}>
                            {c('Action').t`Load more`}
                        </Button>
                    ) : null}
                </>
            )}
        </NewsletterSubscriptionListWrapper>
    );
};
