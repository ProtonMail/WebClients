import * as React from 'react';
import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import {
    CalendarDrawerAppButton,
    ContactDrawerAppButton,
    DrawerApp,
    DrawerSidebar,
    DrawerVisibilityButton,
    FeatureCode,
    MainLogo,
    PrivateAppContainer,
    TopBanners,
    useDrawer,
    useFeature,
    useToggle,
    useUser,
} from '@proton/components';
import { DrawerFeatureFlag } from '@proton/shared/lib/interfaces/Drawer';
import isTruthy from '@proton/utils/isTruthy';

import { useIsActiveLinkReadOnly } from '../../store/_views/utils';
import AppErrorBoundary from '../AppErrorBoundary';
import FileRecoveryBanner from '../ResolveLockedVolumes/LockedVolumesBanner';
import { DriveHeaderPrivate } from './DriveHeader';
import { getDriveDrawerPermissions } from './drawerPermissions';
import DriveSidebar from './sidebar/DriveSidebar';
import NewActionButton from './sidebar/NewActionMenu/NewActionButton';

interface Props {
    children?: JSX.Element | JSX.Element[];
}

const DriveWindow = ({ children }: Props) => {
    const [user] = useUser();
    const { state: expanded, toggle: toggleExpanded } = useToggle();

    const [recoveryBannerVisible, setRecoveryBannerVisible] = useState(true);

    const { isReadOnly } = useIsActiveLinkReadOnly();

    const { feature: drawerFeature } = useFeature<DrawerFeatureFlag>(FeatureCode.Drawer);
    const { showDrawerSidebar } = useDrawer();
    const location = useLocation();

    const drawerSpotlightSeenRef = useRef(false);
    const markSpotlightAsSeen = () => {
        if (drawerSpotlightSeenRef) {
            drawerSpotlightSeenRef.current = true;
        }
    };

    const fileRecoveryBanner = recoveryBannerVisible ? (
        <FileRecoveryBanner
            onClose={() => {
                setRecoveryBannerVisible(false);
            }}
        />
    ) : null;

    const top = <TopBanners>{fileRecoveryBanner}</TopBanners>;

    const logo = <MainLogo to="/" />;
    const header = <DriveHeaderPrivate isHeaderExpanded={expanded} toggleHeaderExpanded={toggleExpanded} />;

    const permissions = getDriveDrawerPermissions({ user, drawerFeature });
    const drawerSidebarButtons = [
        permissions.contacts && <ContactDrawerAppButton onClick={markSpotlightAsSeen} />,
        permissions.calendar && <CalendarDrawerAppButton onClick={markSpotlightAsSeen} />,
    ].filter(isTruthy);

    const isNewUploadDisabled = location.pathname === '/devices' || isReadOnly;

    const sidebar = (
        <DriveSidebar
            logo={logo}
            primary={<NewActionButton className="no-mobile" disabled={isNewUploadDisabled} />}
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
        />
    );

    const canShowDrawer = drawerSidebarButtons.length > 0;

    return (
        <PrivateAppContainer
            top={top}
            header={header}
            sidebar={sidebar}
            drawerSidebar={<DrawerSidebar buttons={drawerSidebarButtons} spotlightSeenRef={drawerSpotlightSeenRef} />}
            drawerVisibilityButton={
                canShowDrawer ? <DrawerVisibilityButton spotlightSeenRef={drawerSpotlightSeenRef} /> : undefined
            }
            drawerApp={<DrawerApp />}
            mainBordered={canShowDrawer && showDrawerSidebar}
        >
            <AppErrorBoundary>{children}</AppErrorBoundary>
        </PrivateAppContainer>
    );
};

export default DriveWindow;
