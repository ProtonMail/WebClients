import { Redirect, Route, Switch } from 'react-router-dom';

import {
    DrawerSidebar,
    DrawerVisibilityButton,
    InboxQuickSettingsAppButton,
    PrivateMainArea,
    useActiveBreakpoint,
    useInboxDesktopBadgeCount,
} from '@proton/components';

import MailHeader from 'proton-mail/components/header/MailHeader';
import { ROUTE_LABEL } from 'proton-mail/constants';
import { MailboxContainerContextProvider } from 'proton-mail/containers/mailbox/MailboxContainerProvider';
import useMailDrawer from 'proton-mail/hooks/drawer/useMailDrawer';
import { useApplyEncryptedSearch } from 'proton-mail/hooks/mailbox/useApplyEncryptedSearch';
import { useElements } from 'proton-mail/hooks/mailbox/useElements';
import { useMailboxFavicon } from 'proton-mail/hooks/mailbox/useMailboxFavicon';
import { useMailboxPageTitle } from 'proton-mail/hooks/mailbox/useMailboxPageTitle';
import { paramsSelector } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { RouterLabelContainer } from './RouterLabelContainer';
import { useMailboxLayoutProvider } from './components/MailboxLayoutContext';
import { MailboxToolbar } from './components/MailboxToolbar';
import { useElementActions } from './hooks/useElementActions';
import { useGetElementParams } from './hooks/useGetElementParams';
import { useRouterNavigation } from './hooks/useRouterNavigation';

export const RouterMailboxContainer = () => {
    // We get most of the data here to avoid unnecessary re-renders
    const params = useMailSelector(paramsSelector);
    const navigation = useRouterNavigation({ labelID: params.labelID });
    const elementParams = useGetElementParams({ params, navigation });
    const elementsData = useElements(elementParams);
    const actions = useElementActions({ params, navigation, elementsData });

    useApplyEncryptedSearch(elementParams);

    const { messageContainerRef, mainAreaRef, resize } = useMailboxLayoutProvider();

    const { labelID, elementID } = params;
    const { elements, loading, placeholderCount } = elementsData;
    const { selectedIDs } = actions;

    useMailboxPageTitle(labelID);
    useMailboxFavicon(labelID);
    useInboxDesktopBadgeCount();

    const breakpoints = useActiveBreakpoint();
    const { columnMode } = useMailboxLayoutProvider();
    const { drawerSidebarButtons, showDrawerSidebar } = useMailDrawer();

    const canShowDrawer = drawerSidebarButtons.length > 0;
    const elementsLength = loading ? placeholderCount : elements.length;
    const showContentPanel = (columnMode && !!elementsLength) || !!elementID;

    if (!labelID) {
        return <Redirect to="/inbox" />;
    }

    return (
        <MailboxContainerContextProvider
            isResizing={resize.isResizing}
            containerRef={messageContainerRef}
            elementID={elementID}
        >
            <MailHeader
                breakpoints={breakpoints}
                elementID={elementID}
                selectedIDs={selectedIDs}
                labelID={labelID}
                toolbar={
                    <MailboxToolbar
                        inHeader
                        params={params}
                        navigation={navigation}
                        elementsData={elementsData}
                        actions={actions}
                    />
                }
                settingsButton={<InboxQuickSettingsAppButton />}
            />
            <PrivateMainArea
                className="flex"
                hasToolbar
                hasRowMode={!showContentPanel}
                ref={mainAreaRef}
                drawerVisibilityButton={canShowDrawer ? <DrawerVisibilityButton /> : undefined}
                drawerSidebar={<DrawerSidebar buttons={drawerSidebarButtons} />}
                mainBordered={canShowDrawer && !!showDrawerSidebar}
            >
                <Switch>
                    <Route
                        path={ROUTE_LABEL}
                        render={() => (
                            <RouterLabelContainer
                                params={params}
                                navigation={navigation}
                                elementsData={elementsData}
                                actions={actions}
                            />
                        )}
                    />
                </Switch>
            </PrivateMainArea>
        </MailboxContainerContextProvider>
    );
};
