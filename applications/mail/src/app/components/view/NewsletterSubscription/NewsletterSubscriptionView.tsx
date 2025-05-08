import { useEffect } from 'react';
import { Redirect } from 'react-router-dom';

import { useActiveBreakpoint, useDrawer, useModalStateObject } from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import { domIsBusy } from '@proton/shared/lib/busy';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import useFlag from '@proton/unleash/useFlag';

import ResizableWrapper from 'proton-mail/components/list/ResizableWrapper';
import { ResizeHandlePosition } from 'proton-mail/components/list/ResizeHandle';
import type { ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import { useMailboxLayoutProvider } from 'proton-mail/router/components/MailboxLayoutContext';
import type { MailboxActions, RouterNavigation } from 'proton-mail/router/interface';
import type { ElementsStateParams } from 'proton-mail/store/elements/elementsTypes';
import { useMailSelector } from 'proton-mail/store/hooks';
import {
    selectAllSubscriptions,
    selectTabLoadingState,
} from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import MailboxList from '../../list/MailboxList';
import ModalOnboarding from './SubscriptionsList/ModalOnboarding';
import { NewsletterSubscriptionListLoader } from './SubscriptionsList/NewsletterSubscriptionCardSkeleton/NewsletterSubscriptionListLoader';
import { NewsletterSubscriptionList } from './SubscriptionsList/NewsletterSubscriptionList';
import { NewsletterSubscriptionListPlaceholder } from './SubscriptionsList/NewsletterSubscriptionListPlaceholder';

import './NewsletterSubscriptionView.scss';

interface NewsletterSubscriptionViewProps {
    params?: ElementsStateParams;
    navigation?: RouterNavigation;
    elementsData: ElementsStructure;
    actions: MailboxActions;
    toolbar: React.ReactNode;
}

export const NewsletterSubscriptionView = ({ elementsData, actions, toolbar }: NewsletterSubscriptionViewProps) => {
    const newsletterSubscriptionsView = useFlag('NewsletterSubscriptionView');
    const mailboxRefactoring = useFlag('MailboxRefactoring');

    const { feature } = useFeature(FeatureCode.NewsletterSubscriptionViewOnboarding);
    const { appInView } = useDrawer();
    const { resizeAreaRef } = useMailboxLayoutProvider();
    const { viewportWidth } = useActiveBreakpoint();

    const subscriptionsObject = useMailSelector(selectAllSubscriptions);
    const loadingSubscriptions = useMailSelector(selectTabLoadingState);

    const onboardingModal = useModalStateObject();

    const isDomBusy = domIsBusy();

    const showMailList = !viewportWidth['<=medium'];

    useEffect(() => {
        if (feature && !feature?.Value && !isDomBusy) {
            onboardingModal.openModal(true);
        }
    }, [feature?.Value, isDomBusy]);

    // The view is not availabe on mobile, we want to make sure to avoid showing it to users
    if (!newsletterSubscriptionsView || !mailboxRefactoring || breakpoints.viewportWidth['<=small']) {
        return <Redirect to={`/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX]}`} />;
    }

    if (!loadingSubscriptions && !subscriptionsObject && Object.keys(subscriptionsObject || {}).length === 0) {
        return <NewsletterSubscriptionListPlaceholder />;
    }

    return (
        <>
            <div className="flex flex-nowrap w-full subscription-container">
                {loadingSubscriptions ? <NewsletterSubscriptionListLoader /> : <NewsletterSubscriptionList />}
                {showMailList && (
                    <ResizableWrapper
                        resizeHandlePosition={ResizeHandlePosition.LEFT}
                        minWidth={320}
                        maxRatio={appInView ? 0.3 : 0.5}
                        className="relative"
                        resizeHandleRef={resizeAreaRef}
                        persistKey="mailSubscriptionsMailboxListWidth"
                        drawerKey="mailSubscriptionsMailboxListWidthWithDrawer"
                        defaultRatio={0.3}
                    >
                        <MailboxList elementsData={elementsData} actions={actions} toolbar={toolbar} />
                    </ResizableWrapper>
                )}
            </div>

            {onboardingModal.render && <ModalOnboarding {...onboardingModal.modalProps} />}
        </>
    );
};
