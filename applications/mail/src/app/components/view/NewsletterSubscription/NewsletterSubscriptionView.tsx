import { useEffect } from 'react';
import { Redirect } from 'react-router-dom';

import { useActiveBreakpoint, useModalStateObject } from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import { domIsBusy } from '@proton/shared/lib/busy';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { useMailSelector } from 'proton-mail/store/hooks';
import {
    selectAllSubscriptions,
    selectTabLoadingState,
} from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import { NewsletterSubscriptionViewPlaceholder } from './NewsletterSubscriptionViewPlaceholder';
import ModalOnboarding from './SubscriptionsList/ModalOnboarding';
import { NewsletterSubscriptionListLoader } from './SubscriptionsList/NewsletterSubscriptionCardSkeleton/NewsletterSubscriptionListLoader';
import { NewsletterSubscriptionList } from './SubscriptionsList/NewsletterSubscriptionList';
import { NewsletterSubscriptionListPlaceholder } from './SubscriptionsList/NewsletterSubscriptionListPlaceholder';

import './NewsletterSubscriptionView.scss';

export const NewsletterSubscriptionView = () => {
    const newsletterSubscriptionsView = useFlag('NewsletterSubscriptionView');
    const mailboxRefactoring = useFlag('MailboxRefactoring');

    const { feature } = useFeature(FeatureCode.NewsletterSubscriptionViewOnboarding);

    const subscriptionsObject = useMailSelector(selectAllSubscriptions);
    const loadingSubscriptions = useMailSelector(selectTabLoadingState);

    const onboardingModal = useModalStateObject();
    const breakpoints = useActiveBreakpoint();

    const isDomBusy = domIsBusy();

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

    const forceRowMode =
        breakpoints.viewportWidth['<=small'] || breakpoints.viewportWidth.medium || breakpoints.viewportWidth.large;

    return (
        <>
            <div className="flex flex-nowrap w-full subscription-container">
                {loadingSubscriptions ? <NewsletterSubscriptionListLoader /> : <NewsletterSubscriptionList />}
                <div className={clsx('flex-1 px-6 pt-5', forceRowMode && 'hidden')}>
                    <NewsletterSubscriptionViewPlaceholder />
                </div>
            </div>

            {onboardingModal.render && <ModalOnboarding {...onboardingModal.modalProps} />}
        </>
    );
};
