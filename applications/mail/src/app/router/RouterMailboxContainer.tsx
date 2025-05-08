import { Redirect, Route, Switch } from 'react-router-dom';

import {
    DrawerSidebar,
    DrawerVisibilityButton,
    InboxQuickSettingsAppButton,
    PrivateMainArea,
} from '@proton/components';
import { CUSTOM_VIEWS, CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';
import clsx from '@proton/utils/clsx';

import MailHeader from 'proton-mail/components/header/MailHeader';
import { NewsletterSubscriptionView } from 'proton-mail/components/view/NewsletterSubscription/NewsletterSubscriptionView';
import { ROUTE_LABEL } from 'proton-mail/constants';
import { MailboxContainerContextProvider } from 'proton-mail/containers/mailbox/MailboxContainerProvider';
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

    const { messageContainerRef, mainAreaRef, resize } = useMailboxLayoutProvider();

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
                elementID={elementID}
                selectedIDs={selectedIDs}
                labelID={labelID}
                settingsButton={<InboxQuickSettingsAppButton />}
                toolbar={
                    // Show toolbar in header when in row layout and an email is selected
                    !columnMode && elementID ? (
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
                                params={params}
                                navigation={navigation}
                                elementsData={elementsData}
                                actions={actions}
                                toolbar={
                                    <MailboxToolbar
                                        params={params}
                                        navigation={navigation}
                                        elementsData={elementsData}
                                        actions={actions}
                                    />
                                }
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
