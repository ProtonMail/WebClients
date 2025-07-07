import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useLoading from '@proton/hooks/useLoading';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { fetchNextNewsletterSubscriptionsPage } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsActions';
import {
    selectTabSubscriptionPaginationQueryString,
    selectTabSubscriptionsList,
    unsubscribingSubscriptionIdSelector,
} from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import { useNewsletterSubscriptionTelemetry } from '../useNewsletterSubscriptionTelemetry';
import { NewsletterSubscriptionCard } from './NewsletterSubscriptionCard';
import { NewsletterSubscriptionListPlaceholder } from './NewsletterSubscriptionListPlaceholder';
import { NewsletterSubscriptionListWrapper } from './NewsletterSubscriptionListWrapper';

export const NewsletterSubscriptionList = () => {
    const dispatch = useMailDispatch();

    const subscriptionList = useMailSelector(selectTabSubscriptionsList);
    const paginationQueryString = useMailSelector(selectTabSubscriptionPaginationQueryString);
    const unsubscribingSubscriptionId = useMailSelector(unsubscribingSubscriptionIdSelector);

    const { sendNewslettersListPagination } = useNewsletterSubscriptionTelemetry();

    const [loading, withLoading] = useLoading();

    const handleNextPageClick = () => {
        void withLoading(dispatch(fetchNextNewsletterSubscriptionsPage()));
        sendNewslettersListPagination();
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
                            isDeleting={unsubscribingSubscriptionId === sub.ID}
                        />
                    ))}
                    {paginationQueryString ? (
                        <Button
                            data-testid="load-more-button"
                            className="w-fit-content mx-auto"
                            loading={loading}
                            onClick={handleNextPageClick}
                        >
                            {c('Action').t`Load more`}
                        </Button>
                    ) : null}
                </>
            )}
        </NewsletterSubscriptionListWrapper>
    );
};
