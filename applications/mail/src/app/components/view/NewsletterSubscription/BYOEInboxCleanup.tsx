import { useEffect } from 'react';

import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';

import useFinishedBYOEImportSenders from '../../../hooks/useFinishedBYOEImportSenders';
import { useMailSelector } from '../../../store/hooks';
import {
    allSubscriptionCount,
    selectTabLoadingState,
} from '../../../store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { BYOEInboxCleanupModal } from './BYOEInboxCleanupModal';

/**
 * Opens the BYOE inbox cleanup window on the Mailing lists view once its senders are ready. The view is ready for it once
 * its introduction window has been seen, or the list has loaded empty (the introduction only shows with newsletters),
 * so the two windows never stack.
 */
export const BYOEInboxCleanup = () => {
    const { feature: introduction } = useFeature(FeatureCode.NewsletterSubscriptionViewOnboarding);
    const loadingSubscriptions = useMailSelector(selectTabLoadingState);
    const subscriptionCount = useMailSelector(allSubscriptionCount);

    const isListLoadedEmpty = !loadingSubscriptions && subscriptionCount === 0;
    const isViewReady = introduction?.Value === true || isListLoadedEmpty;
    const senders = useFinishedBYOEImportSenders(FeatureCode.BYOEInboxCleanupModal, isViewReady);

    const { modalProps, openModal, render } = useModalStateObject();

    useEffect(() => {
        if (senders) {
            openModal(true);
        }
    }, [senders, openModal]);

    if (!render || !senders) {
        return null;
    }

    // As in the global modal provider, a window that fails is dropped rather than breaking the view
    return (
        <ErrorBoundary component={null}>
            <BYOEInboxCleanupModal subscriptions={senders} modalProps={modalProps} />
        </ErrorBoundary>
    );
};
