import { useEffect, useRef } from 'react';
import { Redirect } from 'react-router-dom';

import { ErrorBoundary, StandardErrorPage, useActiveBreakpoint, useModalStateObject } from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import { domIsBusy } from '@proton/shared/lib/busy';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import {
    CUSTOM_VIEWS,
    CUSTOM_VIEWS_LABELS,
    LABEL_IDS_TO_HUMAN,
    type MARK_AS_STATUS,
} from '@proton/shared/lib/mail/constants';
import useFlag from '@proton/unleash/useFlag';

import ResizableWrapper from 'proton-mail/components/list/ResizableWrapper';
import { ResizeHandlePosition } from 'proton-mail/components/list/ResizeHandle';
import type { SOURCE_ACTION } from 'proton-mail/components/list/useListTelemetry';
import MessageOnlyView from 'proton-mail/components/message/MessageOnlyView';
import type { ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import useMailModel from 'proton-mail/hooks/useMailModel';
import { useMailboxLayoutProvider } from 'proton-mail/router/components/MailboxLayoutContext';
import type { MailboxActions, RouterNavigation } from 'proton-mail/router/interface';
import { setParams } from 'proton-mail/store/elements/elementsActions';
import type { ElementsStateParams } from 'proton-mail/store/elements/elementsTypes';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import {
    selectAllSubscriptions,
    selectTabLoadingState,
    selectedElementId,
    selectedSubscriptionIdSelector,
    selectedSubscriptionSelector,
} from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { newsletterSubscriptionsActions } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSlice';

import MailboxList from '../../list/MailboxList';
import ModalOnboarding from './SubscriptionsList/ModalOnboarding';
import { NewsletterSubscriptionListLoader } from './SubscriptionsList/NewsletterSubscriptionCardSkeleton/NewsletterSubscriptionListLoader';
import { NewsletterSubscriptionList } from './SubscriptionsList/NewsletterSubscriptionList';
import { NewsletterSubscriptionListPlaceholder } from './SubscriptionsList/NewsletterSubscriptionListPlaceholder';
import {
    NewsletterSubscriptionMailListHeader,
    NewsletterSubscriptionMailListToolbar,
} from './SubscriptionsList/NewsletterSubscriptionMailComponents';

import './NewsletterSubscriptionView.scss';

interface NewsletterSubscriptionViewProps {
    elementsData: ElementsStructure;
    actions: MailboxActions;
    navigation: RouterNavigation;
    params: ElementsStateParams;
}

// This is used to avoid showing the list of items when no subscription is selected
const emptyElementsData: ElementsStructure = {
    elementIDs: [],
    elements: [],
    total: 0,
    loading: false,
    placeholderCount: 0,
    labelID: CUSTOM_VIEWS[CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS].label,
};

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
    const selectedSubscriptionId = useMailSelector(selectedSubscriptionIdSelector);

    const onboardingModal = useModalStateObject();
    const subscriptionContainerRef = useRef<HTMLDivElement>(null);

    const isDomBusy = domIsBusy();

    const overrideActions = {
        ...actions,
        // We override the handleMarkAs to prevent from moving back to the inbox when marking an email as unread
        handleMarkAs: (status: MARK_AS_STATUS, sourceAction: SOURCE_ACTION) =>
            actions.handleMarkAs(status, sourceAction, { preventBack: true }),
        // We override the handleElement to prevent away navigation when clicking on an email
        handleElement: (elementID: string | undefined) => {
            dispatch(newsletterSubscriptionsActions.setSelectedElementId(elementID));
        },
    };

    useEffect(() => {
        if (feature && !feature?.Value && !isDomBusy) {
            onboardingModal.openModal(true);
        }
    }, [feature?.Value, isDomBusy]);

    useEffect(() => {
        if (activeSubscription && activeSubscription.ID) {
            // Temporary workaround: Set newsletterSubscriptionID as a microtask to avoid race condition
            // with the elements state reset on initial load
            queueMicrotask(() => {
                dispatch(setParams({ newsletterSubscriptionID: activeSubscription.ID, conversationMode: false }));
            });
        }
    }, [activeSubscription?.ID, params.newsletterSubscriptionID]);

    // The view is not availabe on mobile, we want to make sure to avoid showing it to users
    if (!newsletterSubscriptionsView || !mailboxRefactoring || breakpoints.viewportWidth['<=small']) {
        return <Redirect to={`/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX]}`} />;
    }

    if (!loadingSubscriptions && !subscriptionsObject && Object.keys(subscriptionsObject || {}).length === 0) {
        return <NewsletterSubscriptionListPlaceholder />;
    }

    return (
        <>
            <ErrorBoundary component={<StandardErrorPage className="w-full" big />}>
                <div ref={subscriptionContainerRef} className="flex flex-nowrap w-full subscription-container">
                    <ResizableWrapper
                        resizeHandlePosition={ResizeHandlePosition.RIGHT}
                        minWidth={320}
                        maxRatio={0.5}
                        containerRef={subscriptionContainerRef}
                        className="relative bg-norm"
                        resizeHandleRef={resizeAreaRef}
                        persistKey="messageListRatio"
                        defaultRatio={0.4}
                    >
                        {loadingSubscriptions ? <NewsletterSubscriptionListLoader /> : <NewsletterSubscriptionList />}
                    </ResizableWrapper>
                    {!breakpoints.viewportWidth['<=medium'] && (
                        <div className="flex-1 flex flex-column">
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
                                    elementsData={selectedSubscriptionId ? elementsData : emptyElementsData}
                                    actions={overrideActions}
                                    toolbar={
                                        overrideActions.selectedIDs.length > 0 ? (
                                            <NewsletterSubscriptionMailListToolbar
                                                params={params}
                                                navigation={navigation}
                                                elementsData={elementsData}
                                                actions={overrideActions}
                                            />
                                        ) : (
                                            activeSubscription && (
                                                <NewsletterSubscriptionMailListHeader
                                                    subscription={activeSubscription}
                                                    numMessages={elementsData.elementIDs.length}
                                                />
                                            )
                                        )
                                    }
                                    noBorder
                                />
                            )}
                        </div>
                    )}
                </div>
            </ErrorBoundary>

            {onboardingModal.render && <ModalOnboarding {...onboardingModal.modalProps} />}
        </>
    );
};
