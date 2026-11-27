import { useEffect, useState } from 'react';

import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import useFinishedBYOEImportSenders from '../../../hooks/useFinishedBYOEImportSenders';
import { useMailSelector } from '../../../store/hooks';
import {
    allSubscriptionCount,
    selectTabLoadingState,
} from '../../../store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { BYOEInboxCleanupModal } from './BYOEInboxCleanupModal';
import { BYOEInboxCleanupSuccessModal } from './BYOEInboxCleanupSuccessModal';

/**
 * Opens the BYOE inbox cleanup window on the Mailing lists view once its senders are ready. The view is ready for it once
 * its introduction window has been seen, or the list has loaded empty (the introduction only shows with newsletters),
 * so the two windows never stack. When the cleanup window closes having unsubscribed some senders, the success window
 * opens for them.
 */
export const BYOEInboxCleanup = () => {
    const { feature: introduction } = useFeature(FeatureCode.NewsletterSubscriptionViewOnboarding);
    const loadingSubscriptions = useMailSelector(selectTabLoadingState);
    const subscriptionCount = useMailSelector(allSubscriptionCount);

    const isListLoadedEmpty = !loadingSubscriptions && subscriptionCount === 0;
    const isViewReady = introduction?.Value === true || isListLoadedEmpty;
    const senders = useFinishedBYOEImportSenders(FeatureCode.BYOEInboxCleanupModal, isViewReady);

    const { modalProps, openModal, render } = useModalStateObject();
    const successModal = useModalStateObject();
    const [unsubscribed, setUnsubscribed] = useState<NewsletterSubscription[]>([]);

    useEffect(() => {
        if (senders) {
            openModal(true);
        }
    }, [senders, openModal]);

    const handleClosedWithUnsubscribed = (closedWithUnsubscribed: NewsletterSubscription[]) => {
        setUnsubscribed(closedWithUnsubscribed);
        successModal.openModal(true);
    };

    // As in the global modal provider, a window that fails is dropped rather than breaking the view
    return (
        <ErrorBoundary component={null}>
            {render && senders && (
                <BYOEInboxCleanupModal
                    subscriptions={senders}
                    modalProps={modalProps}
                    onClosedWithUnsubscribed={handleClosedWithUnsubscribed}
                />
            )}
            {successModal.render && unsubscribed.length > 0 && (
                <BYOEInboxCleanupSuccessModal {...successModal.modalProps} unsubscribed={unsubscribed} />
            )}
        </ErrorBoundary>
    );
};
