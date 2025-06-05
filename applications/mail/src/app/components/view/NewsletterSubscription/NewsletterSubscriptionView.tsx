import { useEffect } from 'react';
import { Redirect } from 'react-router-dom';

import { ErrorBoundary, StandardErrorPage, useActiveBreakpoint, useModalStateObject } from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import { domIsBusy } from '@proton/shared/lib/busy';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN, type MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import useFlag from '@proton/unleash/useFlag';

import ResizableWrapper from 'proton-mail/components/list/ResizableWrapper';
import { ResizeHandlePosition } from 'proton-mail/components/list/ResizeHandle';
import type { SOURCE_ACTION } from 'proton-mail/components/list/useListTelemetry';
import MessageOnlyView from 'proton-mail/components/message/MessageOnlyView';
import type { ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import useMailModel from 'proton-mail/hooks/useMailModel';
import { useMailboxLayoutProvider } from 'proton-mail/router/components/MailboxLayoutContext';
import { MailboxToolbar } from 'proton-mail/router/components/MailboxToolbar';
import type { MailboxActions, RouterNavigation } from 'proton-mail/router/interface';
import { setParams } from 'proton-mail/store/elements/elementsActions';
import type { ElementsStateParams } from 'proton-mail/store/elements/elementsTypes';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import {
    selectAllSubscriptions,
    selectTabLoadingState,
    selectedElementId,
    selectedSubscriptionSelector,
} from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { newsletterSubscriptionsActions } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSlice';

import MailboxList from '../../list/MailboxList';
import ModalOnboarding from './SubscriptionsList/ModalOnboarding';
import { NewsletterSubscriptionListLoader } from './SubscriptionsList/NewsletterSubscriptionCardSkeleton/NewsletterSubscriptionListLoader';
import { NewsletterSubscriptionList } from './SubscriptionsList/NewsletterSubscriptionList';
import { NewsletterSubscriptionListPlaceholder } from './SubscriptionsList/NewsletterSubscriptionListPlaceholder';
import { NewsletterSubscriptionListTitle } from './SubscriptionsList/NewsletterSubscriptionListTitle';

import './NewsletterSubscriptionView.scss';

interface NewsletterSubscriptionViewProps {
    elementsData: ElementsStructure;
    actions: MailboxActions;
    navigation: RouterNavigation;
    params: ElementsStateParams;
}

export const NewsletterSubscriptionView = ({
    elementsData,
    actions,
    navigation,
    params,
}: NewsletterSubscriptionViewProps) => {
    const mailboxRefactoring = useFlag('MailboxRefactoring');
    const newsletterSubscriptionsView = useFlag('NewsletterSubscriptionView');
    const { feature } = useFeature(FeatureCode.NewsletterSubscriptionViewOnboarding);

    const { resizeAreaRef } = useMailboxLayoutProvider();
    const breakpoints = useActiveBreakpoint();
    const mailSettings = useMailModel('MailSettings');
    const dispatch = useMailDispatch();

    const subscriptionsObject = useMailSelector(selectAllSubscriptions);
    const loadingSubscriptions = useMailSelector(selectTabLoadingState);
    const activeSubscription = useMailSelector(selectedSubscriptionSelector);
    const selectedElement = useMailSelector(selectedElementId);

    const onboardingModal = useModalStateObject();

    const isDomBusy = domIsBusy();

    const overrideActions = {
        ...actions,
        // We override the handleMarkAs to prevent from moving back to the inbox when marking an email as unread
        handleMarkAs: (status: MARK_AS_STATUS, sourceAction: SOURCE_ACTION) =>
            actions.handleMarkAs(status, sourceAction, { preventBack: true }),
    };

    useEffect(() => {
        if (feature && !feature?.Value && !isDomBusy) {
            onboardingModal.openModal(true);
        }
    }, [feature?.Value, isDomBusy]);

    // The view is not availabe on mobile, we want to make sure to avoid showing it to users
    useEffect(() => {
        if (activeSubscription && activeSubscription.ID) {
            dispatch(setParams({ newsletterSubscriptionID: activeSubscription.ID, conversationMode: false }));
        }
    }, [activeSubscription?.ID]);

    if (!newsletterSubscriptionsView || !mailboxRefactoring || breakpoints.viewportWidth['<=small']) {
        return <Redirect to={`/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX]}`} />;
    }

    if (!loadingSubscriptions && !subscriptionsObject && Object.keys(subscriptionsObject || {}).length === 0) {
        return <NewsletterSubscriptionListPlaceholder />;
    }

    return (
        <>
            <ErrorBoundary component={<StandardErrorPage className="w-full" big />}>
                <div className="flex flex-nowrap w-full subscription-container">
                    {loadingSubscriptions ? <NewsletterSubscriptionListLoader /> : <NewsletterSubscriptionList />}
                    {!breakpoints.viewportWidth['<=medium'] && (
                        <ResizableWrapper
                            resizeHandlePosition={ResizeHandlePosition.LEFT}
                            minWidth={320}
                            maxRatio={0.5}
                            className="relative bg-norm"
                            resizeHandleRef={resizeAreaRef}
                            persistKey="mailSubscriptionsMailboxListWidth"
                            drawerKey="mailSubscriptionsMailboxListWidthWithDrawer"
                            defaultRatio={0.35}
                        >
                            {selectedElement ? (
                                <MessageOnlyView
                                    showBackButton
                                    hidden={!selectedElement}
                                    labelID={MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL}
                                    mailSettings={mailSettings}
                                    messageID={selectedElement as string}
                                    onBack={() =>
                                        dispatch(newsletterSubscriptionsActions.setSelectedElementId(undefined))
                                    }
                                    columnLayout={false}
                                    isComposerOpened={false}
                                    onMessageReady={overrideActions.onMessageReady}
                                />
                            ) : (
                                <MailboxList
                                    overrideColumnMode
                                    elementsData={elementsData}
                                    actions={overrideActions}
                                    toolbar={
                                        overrideActions.selectedIDs.length > 0 ? (
                                            <MailboxToolbar
                                                params={params}
                                                navigation={navigation}
                                                elementsData={elementsData}
                                                actions={overrideActions}
                                                /* Force the columnLayout to be false to visually align with single line toolbar*/
                                                overrideColumnMode={false}
                                            />
                                        ) : (
                                            activeSubscription && (
                                                <NewsletterSubscriptionListTitle
                                                    subscription={activeSubscription}
                                                    numMessages={elementsData.elementIDs.length}
                                                />
                                            )
                                        )
                                    }
                                    noBorder
                                />
                            )}
                        </ResizableWrapper>
                    )}
                </div>
            </ErrorBoundary>

            {onboardingModal.render && <ModalOnboarding {...onboardingModal.modalProps} />}
        </>
    );
};
