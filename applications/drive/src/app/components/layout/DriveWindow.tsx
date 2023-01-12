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

import AppErrorBoundary from '../AppErrorBoundary';
import FileRecoveryBanner from '../ResolveLockedVolumes/LockedVolumesBanner';
import UploadSidebarButton from '../sections/Drive/UploadButton';
import ShareFileSidebarButton from '../sections/SharedLinks/ShareFileSidebarButton';
import EmptyTrashSidebarButton from '../sections/Trash/EmptyTrashSidebarButton';
import { DriveHeaderPrivate } from './DriveHeader';
import DriveSidebar from './DriveSidebar/DriveSidebar';
import { getDriveDrawerPermissions } from './drawerPermissions';

interface Props {
    children?: JSX.Element | JSX.Element[];
}

const DriveWindow = ({ children }: Props) => {
    const location = useLocation();
    const [user] = useUser();
    const { state: expanded, toggle: toggleExpanded } = useToggle();

    const [recoveryBannerVisible, setReoveryBannerVisible] = useState(true);

    const { feature: drawerFeature } = useFeature<DrawerFeatureFlag>(FeatureCode.Drawer);
    const { showDrawerSidebar } = useDrawer();

    const drawerSpotlightSeenRef = useRef(false);
    const markSpotlightAsSeen = () => {
        if (drawerSpotlightSeenRef) {
            drawerSpotlightSeenRef.current = true;
        }
    };

    const fileRecoveryBanner = recoveryBannerVisible ? (
        <FileRecoveryBanner
            onClose={() => {
                setReoveryBannerVisible(false);
            }}
        />
    ) : null;

    const top = <TopBanners>{fileRecoveryBanner}</TopBanners>;

    let PrimaryButton = UploadSidebarButton;
    if (location.pathname === '/trash') {
        PrimaryButton = EmptyTrashSidebarButton;
    } else if (location.pathname === '/shared-urls') {
        PrimaryButton = ShareFileSidebarButton;
    }

    const logo = <MainLogo to="/" />;
    const header = (
        <DriveHeaderPrivate
            logo={logo}
            floatingPrimary={PrimaryButton && <PrimaryButton mobileVersion />}
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
        />
    );

    const permissions = getDriveDrawerPermissions({ user, drawerFeature });
    const drawerSidebarButtons = [
        permissions.contacts && <ContactDrawerAppButton onClick={markSpotlightAsSeen} />,
        permissions.calendar && <CalendarDrawerAppButton onClick={markSpotlightAsSeen} />,
    ].filter(isTruthy);

    const sidebar = (
        <DriveSidebar
            logo={logo}
            primary={PrimaryButton && <PrimaryButton />}
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
