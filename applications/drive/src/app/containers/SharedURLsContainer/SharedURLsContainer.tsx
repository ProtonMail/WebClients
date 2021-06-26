import React, { useMemo, useCallback } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Switch, Route, Redirect } from 'react-router';
import { PrivateAppContainer, useToggle, MainLogo } from 'react-components';
import AppErrorBoundary from '../../components/AppErrorBoundary';
import DriveHeader from '../../components/layout/DriveHeader';
import DriveSidebar from '../../components/layout/DriveSidebar/DriveSidebar';
import SharedURLsContainerView from './SharedURLsContainerView';
import { useDriveCache } from '../../components/DriveCache/DriveCacheProvider';
import ShareFileButton from '../../components/SharedLinks/ShareFileButton';

const SharedURLsContainer = ({ match }: RouteComponentProps<{ shareId?: string }>) => {
    const cache = useDriveCache();
    const { state: expanded, toggle: toggleExpanded } = useToggle();

    const shareId = useMemo(() => {
        const shareId = match.params.shareId || cache.get.defaultShareMeta()?.ShareID;
        if (!shareId) {
            throw new Error('Drive is not initilized, cache has been cleared unexpectedly');
        }
        return shareId;
    }, [match.params.shareId]);

    const logo = <MainLogo to="/" />;
    const header = (
        <DriveHeader
            logo={logo}
            floatingPrimary={<ShareFileButton floating shareId={shareId} />}
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
        />
    );

    const sidebar = (
        <DriveSidebar
            logo={logo}
            shareId={shareId}
            primary={<ShareFileButton className="no-mobile" shareId={shareId} />}
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
        />
    );

    const renderContainerView = useCallback(() => <SharedURLsContainerView shareId={shareId} />, [shareId]);

    return (
        <PrivateAppContainer header={header} sidebar={sidebar}>
            <AppErrorBoundary>
                <Switch>
                    <Route path="/:shareId?/:type?/:linkId?" exact component={renderContainerView} />
                    <Redirect to="/" />
                </Switch>
            </AppErrorBoundary>
        </PrivateAppContainer>
    );
};

export default SharedURLsContainer;
