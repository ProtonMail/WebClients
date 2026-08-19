import { useEffect, useRef } from 'react';
import { Redirect } from 'react-router-dom';

import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { FeatureCode, useFeature } from '@proton/features';
import { logger } from '@proton/logger';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { domIsBusy } from '@proton/shared/lib/busy';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { CUSTOM_VIEWS, CUSTOM_VIEWS_LABELS, type MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { useCategoriesView } from '../../categoryView/useCategoriesView';
import { ResizableWrapper } from '../../list/ResizableWrapper';
import { ResizeHandlePosition } from '../../list/ResizeHandle';
import type { SOURCE_ACTION } from '../../list/list-telemetry/useListTelemetry';
import MessageOnlyView from '../../message/MessageOnlyView';
import { getInboxRedirectUrl } from '../../../helpers/mailboxUrl';
import type { ElementsStructure } from '../../../hooks/mailbox/useElements';
import { DEFAULT_MIN_WIDTH_OF_MAILBOX_LIST } from '../../../hooks/useResizableUtils';
import { useMailboxLayoutProvider } from '../../../router/components/MailboxLayoutContext';
import type { MailboxActions, RouterNavigation } from '../../../router/interface';
import { setParams } from '../../../store/elements/elementsActions';
import { selectNewsletterSubscriptionID } from '../../../store/elements/elementsSelectors';
import { useMailDispatch, useMailSelector } from '../../../store/hooks';
import {
    allSubscriptionCount,
    selectTabLoadingState,
    selectedElementId,
    selectedSubscriptionIdSelector,
    selectedSubscriptionSelector,
    selectedTabSubscriptionsCount,
} from '../../../store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { newsletterSubscriptionsActions } from '../../../store/newsletterSubscriptions/newsletterSubscriptionsSlice';

import MailboxList from '../../list/MailboxList';
import ModalOnboarding from './SubscriptionsList/ModalOnboarding';
import { NewsletterSubscriptionListLoader } from './SubscriptionsList/NewsletterSubscriptionCardSkeleton/NewsletterSubscriptionListLoader';
import { NewsletterSubscriptionList } from './SubscriptionsList/NewsletterSubscriptionList';
import {
    NewsletterSubscriptionMailListHeader,
    NewsletterSubscriptionMailListToolbar,
} from './SubscriptionsList/NewsletterSubscriptionMailComponents';
import { NewsletterSubscriptionViewPlaceholder } from './SubscriptionsList/NewsletterSubscriptionViewPlaceholder';
import { useNewsletterSubscriptionTelemetry } from './useNewsletterSubscriptionTelemetry';

import './NewsletterSubscriptionView.scss';

interface NewsletterSubscriptionViewProps {
    elementsData: ElementsStructure;
    actions: MailboxActions;
    navigation: RouterNavigation;
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

export const NewsletterSubscriptionView = ({ elementsData, actions, navigation }: NewsletterSubscriptionViewProps) => {
    const { feature } = useFeature(FeatureCode.NewsletterSubscriptionViewOnboarding);
    const newsletterSubscriptionID = useMailSelector(selectNewsletterSubscriptionID);

    const { resizeAreaRef } = useMailboxLayoutProvider();
    const breakpoints = useActiveBreakpoint();
    const [mailSettings] = useMailSettings();
    const dispatch = useMailDispatch();

    const loadingSubscriptions = useMailSelector(selectTabLoadingState);
    const activeSubscription = useMailSelector(selectedSubscriptionSelector);
    const selectedElement = useMailSelector(selectedElementId);
    const selectedSubscriptionId = useMailSelector(selectedSubscriptionIdSelector);
    const subscriptionCount = useMailSelector(allSubscriptionCount);
    const selectedTabSubCount = useMailSelector(selectedTabSubscriptionsCount);

    const onboardingModal = useModalStateObject();
    const subscriptionContainerRef = useRef<HTMLDivElement>(null);

    const { sendNewslettersViewVisit } = useNewsletterSubscriptionTelemetry();
    const { isCategoryViewEnabled, isCategoryViewEnabledSettled } = useCategoriesView();
    const hasSentPageView = useRef(false);

    const isDomBusy = domIsBusy();
    const redirectURL = getInboxRedirectUrl({ isCategoryViewEnabled, isCategoryViewEnabledSettled });

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

        if (!hasSentPageView.current) {
            sendNewslettersViewVisit(!!(feature && !feature?.Value));
            hasSentPageView.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-FE8E1A
    }, [feature?.Value, isDomBusy]);

    useEffect(() => {
        if (activeSubscription && activeSubscription.ID) {
            // Temporary workaround: Set newsletterSubscriptionID as a microtask to avoid race condition
            // with the elements state reset on initial load
            queueMicrotask(() => {
                dispatch(setParams({ newsletterSubscriptionID: activeSubscription.ID, conversationMode: false }));
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-A7A3D4
    }, [activeSubscription?.ID, newsletterSubscriptionID]);

    // The view is not available on mobile, we want to make sure to avoid showing it to users
    if (breakpoints.viewportWidth['<=small']) {
        return redirectURL ? <Redirect to={redirectURL} /> : <Redirect to="/" />;
    }

    if (subscriptionCount === 0) {
        return <NewsletterSubscriptionViewPlaceholder loading={!!loadingSubscriptions} />;
    }

    const hideEmailList = breakpoints.viewportWidth['<=medium'];

    return (
        <>
            <ErrorBoundary component={<StandardErrorPage className="w-full" big />} logger={logger}>
                <div ref={subscriptionContainerRef} className="flex flex-nowrap w-full subscription-container">
                    <ResizableWrapper
                        resizeHandlePosition={ResizeHandlePosition.RIGHT}
                        minWidth={DEFAULT_MIN_WIDTH_OF_MAILBOX_LIST}
                        maxRatio={0.5}
                        containerRef={subscriptionContainerRef}
                        className="relative"
                        resizeHandleRef={resizeAreaRef}
                        persistKey="messageListRatio"
                        defaultRatio={0.4}
                        resizingDisabled={hideEmailList}
                    >
                        {loadingSubscriptions ? <NewsletterSubscriptionListLoader /> : <NewsletterSubscriptionList />}
                    </ResizableWrapper>
                    {!hideEmailList && (
                        <div className="flex-1 flex flex-column flex-nowrap">
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
                                    noPlaceholder={selectedTabSubCount === 0}
                                    toolbar={
                                        overrideActions.selectedIDs.length > 0 ? (
                                            <NewsletterSubscriptionMailListToolbar
                                                navigation={navigation}
                                                elementsData={elementsData}
                                                actions={overrideActions}
                                            />
                                        ) : (
                                            activeSubscription && (
                                                <NewsletterSubscriptionMailListHeader
                                                    subscription={activeSubscription}
                                                    numMessages={elementsData.elementIDs.length}
                                                    loading={elementsData.loading}
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
