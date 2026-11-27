import { useEffect, useState } from 'react';

import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

import useFinishedBYOEImportSenders from '../../../hooks/useFinishedBYOEImportSenders';
import { useMailDispatch, useMailSelector } from '../../../store/hooks';
import { layoutActions } from '../../../store/layout/layoutSlice';
import {
    allSubscriptionCount,
    selectTabLoadingState,
} from '../../../store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { BYOEInboxCleanupModal } from './BYOEInboxCleanupModal';
import { BYOEInboxCleanupSuccessModal } from './BYOEInboxCleanupSuccessModal';
import type { BYOEInboxCleanupOutcome } from './interface';

/**
 * Opens the BYOE inbox cleanup window on the Mailing lists view once its senders are ready. The view is ready for it once
 * its introduction window has been seen, or the list has loaded empty (the introduction only shows with newsletters),
 * so the two windows never stack. When the cleanup window closes having unsubscribed some senders, the success window
 * opens for them. When the success window closes after every ticked sender was unsubscribed, the alias spotlight shows on
 * the Security center button. It's dropped for this cleanup when the side panel is hidden, when Security center is
 * already open (they're already looking at aliases, and on narrower screens the drawer covers the button the spotlight
 * points at) or on a small screen (where it can't render). It shows once ever: only while `BYOEInboxCleanupAliasSpotlight`
 * is still true, and Mail sets that to false once the spotlight has shown.
 */
export const BYOEInboxCleanup = () => {
    const { feature: introduction } = useFeature(FeatureCode.NewsletterSubscriptionViewOnboarding);
    const loadingSubscriptions = useMailSelector(selectTabLoadingState);
    const subscriptionCount = useMailSelector(allSubscriptionCount);

    const isListLoadedEmpty = !loadingSubscriptions && subscriptionCount === 0;
    const isViewReady = introduction?.Value === true || isListLoadedEmpty;
    const senders = useFinishedBYOEImportSenders(FeatureCode.BYOEInboxCleanupModal, isViewReady);
    const { feature: aliasSpotlight } = useFeature(FeatureCode.BYOEInboxCleanupAliasSpotlight);

    const { modalProps, openModal, render } = useModalStateObject();
    const successModal = useModalStateObject();
    const [outcome, setOutcome] = useState<BYOEInboxCleanupOutcome>();
    const dispatch = useMailDispatch();
    const { showDrawerSidebar, appInView } = useDrawer();
    const { viewportWidth } = useActiveBreakpoint();

    useEffect(() => {
        if (senders) {
            openModal(true);
        }
    }, [senders, openModal]);

    const handleClosedWithUnsubscribed = (closedWithOutcome: BYOEInboxCleanupOutcome) => {
        setOutcome(closedWithOutcome);
        successModal.openModal(true);
    };

    const handleSuccessClose = () => {
        successModal.modalProps.onClose();
        const isSecurityCenterOpen = isAppInView(DRAWER_NATIVE_APPS.SECURITY_CENTER, appInView);
        // On a small screen the spotlight can't render, and setting it due would still close the breach alerts one
        if (
            !outcome?.allDone ||
            !showDrawerSidebar ||
            isSecurityCenterOpen ||
            viewportWidth['<=small'] ||
            aliasSpotlight?.Value !== true
        ) {
            return;
        }
        dispatch(layoutActions.setAliasSpotlightDue(true));
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
            {successModal.render && outcome && (
                <BYOEInboxCleanupSuccessModal
                    {...successModal.modalProps}
                    onClose={handleSuccessClose}
                    unsubscribed={outcome.unsubscribed}
                />
            )}
        </ErrorBoundary>
    );
};
