import { type RefObject, useMemo } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';

import {
    DrawerSidebar,
    DrawerVisibilityButton,
    InboxQuickSettingsAppButton,
    PrivateMainArea,
    useActiveBreakpoint,
} from '@proton/components';
import { getSearchParams } from '@proton/shared/lib/helpers/url';
import { CUSTOM_VIEWS, CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';
import type { Filter, Sort } from '@proton/shared/lib/mail/search';
import clsx from '@proton/utils/clsx';

import MailHeader from 'proton-mail/components/header/MailHeader';
import useScrollToTop from 'proton-mail/components/list/useScrollToTop';
import { NewsletterSubscriptionView } from 'proton-mail/components/view/NewsletterSubscription/NewsletterSubscriptionView';
import { ROUTE_LABEL } from 'proton-mail/constants';
import { MailboxContainerContextProvider } from 'proton-mail/containers/mailbox/MailboxContainerProvider';
import { filterFromUrl, pageFromUrl, sortFromUrl } from 'proton-mail/helpers/mailboxUrl';
import useMailDrawer from 'proton-mail/hooks/drawer/useMailDrawer';
import { useElements } from 'proton-mail/hooks/mailbox/useElements';
import { paramsSelector } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { RouterLabelContainer } from './RouterLabelContainer';
import { useMailboxLayoutProvider } from './components/MailboxLayoutContext';
import { MailboxToolbar } from './components/MailboxToolbar';
import { useElementActions } from './hooks/useElementActions';
import { useGetElementParams } from './hooks/useGetElementParams';
import { useRouterNavigation } from './hooks/useRouterNavigation';
import { useMailboxContainerSideEffects } from './sideEffects/useMailboxContainerSideEffects';

export const RouterMailboxContainer = () => {
    // We get most of the data here to avoid unnecessary re-renders
    const params = useMailSelector(paramsSelector);
    const navigation = useRouterNavigation({ labelID: params.labelID });
    const elementsParams = useGetElementParams({ params, navigation });
    const elementsData = useElements(elementsParams);
    const actions = useElementActions({ params, navigation, elementsData });

    const { messageContainerRef, mainAreaRef, resize, listContainerRef } = useMailboxLayoutProvider();

    const { labelID, elementID } = params;
    const { selectedIDs } = actions;

    const { columnMode } = useMailboxLayoutProvider();
    const { drawerSidebarButtons, showDrawerSidebar } = useMailDrawer();

    const canShowDrawer = drawerSidebarButtons.length > 0;
    const hasRowMode = !columnMode;

    /**
     * Temporary: Router mailbox side effects
     */
    useMailboxContainerSideEffects({
        isSearch: params.isSearching,
        handleCheckAll: actions.handleCheckAll,
        elementsParams,
        elements: elementsData.elements,
        loading: elementsData.loading,
        labelID,
    });

    // TODO this will need to be improved to avoid depending on the URL, fix the test for the moment
    const location = useLocation();
    const urlPage = pageFromUrl(location);
    const searchParams = getSearchParams(location.hash);
    const sort = useMemo<Sort>(() => sortFromUrl(location, labelID), [searchParams.sort, labelID]);
    const filter = useMemo<Filter>(() => filterFromUrl(location), [searchParams.filter]);
    useScrollToTop(listContainerRef as RefObject<HTMLElement>, [urlPage, labelID, sort, filter, elementsParams.search]);
    const breakpoints = useActiveBreakpoint();
    if (!labelID) {
        return <Redirect to="/inbox" />;
    }

    const viewPortIsNarrow = breakpoints.viewportWidth['<=small'] || breakpoints.viewportWidth.medium;

    return (
        <MailboxContainerContextProvider
            isResizing={resize.isResizing}
            containerRef={messageContainerRef}
            elementID={elementID}
        >
            <MailHeader
                elementID={elementID}
                selectedIDs={selectedIDs}
                labelID={labelID}
                settingsButton={<InboxQuickSettingsAppButton />}
                toolbar={
                    // Show toolbar in header when in row layout and an email is selected
                    (!columnMode && elementID) || viewPortIsNarrow ? (
                        <div className="flex flex-nowrap">
                            <MailboxToolbar
                                inHeader
                                params={params}
                                navigation={navigation}
                                elementsData={elementsData}
                                actions={actions}
                            />
                        </div>
                    ) : undefined
                }
            />
            <PrivateMainArea
                className={clsx([
                    'flex',
                    !columnMode && elementID && 'row-layout-email-view full-width-email',
                    columnMode && 'column-layout-view',
                ])}
                hasToolbar
                hasRowMode={hasRowMode}
                ref={mainAreaRef}
                drawerVisibilityButton={canShowDrawer ? <DrawerVisibilityButton /> : undefined}
                drawerSidebar={<DrawerSidebar buttons={drawerSidebarButtons} />}
                mainBordered={canShowDrawer && !!showDrawerSidebar}
            >
                <Switch>
                    <Route
                        path={CUSTOM_VIEWS[CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS].route}
                        render={() => (
                            <NewsletterSubscriptionView
                                elementsData={elementsData}
                                actions={actions}
                                navigation={navigation}
                                params={params}
                            />
                        )}
                    />
                    <Route
                        path={ROUTE_LABEL}
                        render={() => (
                            <RouterLabelContainer
                                params={params}
                                navigation={navigation}
                                elementsData={elementsData}
                                actions={actions}
                                hasRowMode={hasRowMode}
                            />
                        )}
                    />
                </Switch>
            </PrivateMainArea>
        </MailboxContainerContextProvider>
    );
};
