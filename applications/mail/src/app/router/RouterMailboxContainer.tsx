import { useEffect, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { useRetentionPolicies } from '@proton/account/retentionPolicies/hooks';
import { useUser } from '@proton/account/user/hooks';
import DrawerSidebar from '@proton/components/components/drawer/DrawerSidebar';
import DrawerVisibilityButton from '@proton/components/components/drawer/DrawerVisibilityButton';
import InboxQuickSettingsAppButton from '@proton/components/components/drawer/drawerAppButtons/InboxQuickSettingsAppButton';
import PrivateMainArea from '@proton/components/containers/layout/PrivateMainArea';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { CUSTOM_VIEWS, CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';
import { isAdminOrLoginAsAdmin } from '@proton/shared/lib/user/helpers';
import clsx from '@proton/utils/clsx';

import { CategoriesOnboardingProvider } from '../components/categoryView/categoriesOnboarding/CategoriesOnboardingContext';
import { CategoriesOnboardingSpotlight } from '../components/categoryView/categoriesOnboarding/CategoriesOnboardingSpotlights';
import { OnboardingStep } from '../components/categoryView/categoriesOnboarding/onboardingInterface';
import MailHeader from '../components/header/MailHeader';
import { NewsletterSubscriptionView } from '../components/view/NewsletterSubscription/NewsletterSubscriptionView';
import { ROUTE_LABEL } from '../constants';
import { MailboxContainerContextProvider } from '../containers/mailbox/MailboxContainerProvider';
import { getInboxRedirectUrl } from '../helpers/mailboxUrl';
import useMailDrawer from '../hooks/drawer/useMailDrawer';
import { useElements } from '../hooks/mailbox/useElements';
import { useScrollListToTopOnViewChange } from './hooks/useScrollListToTopOnViewChange';
import { selectElementID, selectIsSearching, selectLabelID } from '../store/elements/elementsSelectors';
import { useMailDispatch, useMailSelector } from '../store/hooks';
import { layoutActions } from '../store/layout/layoutSlice';

import { RouterLabelContainer } from './RouterLabelContainer';
import { useMailboxLayoutProvider } from './components/MailboxLayoutContext';
import { MailboxToolbar } from './components/MailboxToolbar';
import { useElementActions } from './hooks/useElementActions';
import { useGetElementParams } from './hooks/useGetElementParams';
import { useMeasureSearchDuration } from './hooks/useMeasureSearchDuration';
import { useRouterNavigation } from './hooks/useRouterNavigation';
import { useMailboxContainerSideEffects } from './sideEffects/useMailboxContainerSideEffects';

export const RouterMailboxContainer = () => {
    // We get most of the data here to avoid unnecessary re-renders
    const labelID = useMailSelector(selectLabelID);
    const elementID = useMailSelector(selectElementID);
    const isSearching = useMailSelector(selectIsSearching);

    const navigation = useRouterNavigation({ labelID: labelID });
    const elementsParams = useGetElementParams({ navigation });
    const elementsData = useElements(elementsParams);
    const actions = useElementActions({ navigation, elementsData });

    const [user] = useUser();
    const [retentionRules] = useRetentionPolicies();
    const { isColumnModeActive, messageContainerRef, mainAreaRef } = useMailboxLayoutProvider();
    useScrollListToTopOnViewChange();

    const { drawerSidebarButtons, showDrawerSidebar } = useMailDrawer();

    const canShowDrawer = drawerSidebarButtons.length > 0;
    const hasRowMode = !isColumnModeActive;

    const [isResizing, setIsResizing] = useState(false);

    const { shouldSeeWideToolbars, isCategoryViewEnabled, isCategoryViewEnabledSettled } = useCategoriesData();

    /**
     * Temporary: Router mailbox side effects
     */
    useMailboxContainerSideEffects({
        isSearch: isSearching,
        handleCheckAll: actions.handleCheckAll,
        elementsParams,
        elements: elementsData.elements,
        loading: elementsData.loading,
        labelID: labelID,
    });

    const dispatch = useMailDispatch();
    useMeasureSearchDuration(elementsParams, isSearching, elementsData);
    const breakpoints = useActiveBreakpoint();

    // When the labelID is updated, reset the select all value
    useEffect(() => {
        dispatch(layoutActions.setSelectAll(false));
    }, [labelID, dispatch]);

    const redirectURL = getInboxRedirectUrl({ isCategoryViewEnabled, isCategoryViewEnabledSettled });
    const inboxRedirect = redirectURL ? <Redirect to={redirectURL} /> : null;

    if (!labelID) {
        return inboxRedirect;
    }

    // Prevent non-admin users from accessing the Deleted folder via URL
    if (labelID === MAILBOX_LABEL_IDS.SOFT_DELETED && !isAdminOrLoginAsAdmin(user)) {
        return inboxRedirect;
    }

    // Redirect users without retention rules from accessing the Deleted folder via URL
    if (labelID === MAILBOX_LABEL_IDS.SOFT_DELETED && retentionRules && !retentionRules.length) {
        return inboxRedirect;
    }

    const viewPortIsNarrow = breakpoints.viewportWidth['<=small'] || breakpoints.viewportWidth.medium;

    return (
        <MailboxContainerContextProvider containerRef={messageContainerRef} isResizing={isResizing}>
            <CategoriesOnboardingProvider>
                <MailHeader
                    elementsData={elementsData}
                    actions={actions}
                    labelID={labelID}
                    settingsButton={
                        <CategoriesOnboardingSpotlight step={OnboardingStep.CUSTOMIZE}>
                            <InboxQuickSettingsAppButton />
                        </CategoriesOnboardingSpotlight>
                    }
                    toolbar={
                        // Show toolbar in header when in row layout and an email is selected
                        !shouldSeeWideToolbars && ((!isColumnModeActive && elementID) || viewPortIsNarrow) ? (
                            <MailboxToolbar
                                inHeader
                                navigation={navigation}
                                elementsData={elementsData}
                                actions={actions}
                            />
                        ) : undefined
                    }
                />
                <PrivateMainArea
                    className={clsx([
                        'flex',
                        !isColumnModeActive && elementID && 'row-layout-email-view full-width-email',
                        isColumnModeActive && 'column-layout-view',
                        breakpoints.viewportWidth['<=small'] && 'border-none',
                    ])}
                    innerClassName={breakpoints.viewportWidth['<=small'] ? 'border-none' : ''}
                    hasToolbar
                    hasRowMode={hasRowMode}
                    ref={mainAreaRef}
                    drawerVisibilityButton={canShowDrawer ? <DrawerVisibilityButton /> : undefined}
                    drawerSidebar={<DrawerSidebar buttons={drawerSidebarButtons} />}
                    mainBordered={canShowDrawer && !!showDrawerSidebar}
                >
                    <Switch>
                        {redirectURL && <Redirect exact from="/" to={redirectURL} />}
                        <Route
                            path={CUSTOM_VIEWS[CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS].route}
                            render={() => (
                                <NewsletterSubscriptionView
                                    elementsData={elementsData}
                                    actions={actions}
                                    navigation={navigation}
                                />
                            )}
                        />
                        <Route
                            path={ROUTE_LABEL}
                            render={() => (
                                <RouterLabelContainer
                                    navigation={navigation}
                                    elementsData={elementsData}
                                    actions={actions}
                                    hasRowMode={hasRowMode}
                                    onResizingChange={setIsResizing}
                                />
                            )}
                        />
                    </Switch>
                </PrivateMainArea>
            </CategoriesOnboardingProvider>
        </MailboxContainerContextProvider>
    );
};
