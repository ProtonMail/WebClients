import { useEffect, useMemo, useCallback } from 'react';
import { PrivateAppContainer, useToggle, MainLogo } from '@proton/components';
import { Route, Redirect, Switch, RouteComponentProps } from 'react-router-dom';
import DriveHeader from '../../components/layout/DriveHeader';
import DriveSidebar from '../../components/layout/DriveSidebar/DriveSidebar';
import TrashContainerView from './TrashContainerView';
import EmptyTrashButton from '../../components/Drive/Trash/EmptyTrashButton';
import { useDriveCache } from '../../components/DriveCache/DriveCacheProvider';
import { useDriveActiveFolder } from '../../components/Drive/DriveFolderProvider';
import AppErrorBoundary from '../../components/AppErrorBoundary';

const TrashContainer = ({ match }: RouteComponentProps<{ shareId?: string }>) => {
    const cache = useDriveCache();
    const { setFolder } = useDriveActiveFolder();
    const { state: expanded, toggle: toggleExpanded } = useToggle();

    useEffect(() => {
        setFolder(undefined);
    }, []);

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
            floatingPrimary={<EmptyTrashButton floating shareId={shareId} />}
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
        />
    );

    const sidebar = (
        <DriveSidebar
            logo={logo}
            shareId={shareId}
            primary={<EmptyTrashButton className="no-mobile" shareId={shareId} />}
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
        />
    );

    const renderContainerView = useCallback(() => <TrashContainerView shareId={shareId} />, [shareId]);

    return (
        <PrivateAppContainer header={header} sidebar={sidebar}>
            <AppErrorBoundary>
                <Switch>
                    <Route path="/trash/:shareId?" exact component={renderContainerView} />
                    <Redirect to="/trash" />
                </Switch>
            </AppErrorBoundary>
        </PrivateAppContainer>
    );
};

export default TrashContainer;
