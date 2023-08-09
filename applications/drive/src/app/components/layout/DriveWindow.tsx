import * as React from 'react';
import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import {
    CalendarDrawerAppButton,
    ContactDrawerAppButton,
    DrawerApp,
    DrawerSidebar,
    MainLogo,
    PrivateAppContainer,
    PrivateMainArea,
    QuickSettingsAppButton,
    TopBanners,
    useDrawer,
    useOpenDrawerOnLoad,
    useToggle,
    useUser,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { useIsActiveLinkReadOnly } from '../../store/_views/utils';
import AppErrorBoundary from '../AppErrorBoundary';
import FileRecoveryBanner from '../ResolveLockedVolumes/LockedVolumesBanner';
import DriveQuickSettings from '../drawer/DriveQuickSettings';
import { DriveHeaderPrivate } from './DriveHeader';
import { getDriveDrawerPermissions } from './drawerPermissions';
import ActionMenuButton from './sidebar/ActionMenu/ActionMenuButton';
import DriveSidebar from './sidebar/DriveSidebar';

interface Props {
    children?: JSX.Element | JSX.Element[];
}

const DriveWindow = ({ children }: Props) => {
    const [user] = useUser();
    const { state: expanded, toggle: toggleExpanded } = useToggle();

    const [recoveryBannerVisible, setRecoveryBannerVisible] = useState(true);

    const { isReadOnly } = useIsActiveLinkReadOnly();

    useOpenDrawerOnLoad();
    const { appInView } = useDrawer();
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

    const permissions = getDriveDrawerPermissions({ user });
    const drawerSidebarButtons = [
        permissions.contacts && (
            <ContactDrawerAppButton
                onClick={markSpotlightAsSeen}
                aria-expanded={isAppInView(DRAWER_NATIVE_APPS.CONTACTS, appInView)}
            />
        ),
        permissions.calendar && (
            <CalendarDrawerAppButton
                onClick={markSpotlightAsSeen}
                aria-expanded={isAppInView(APPS.PROTONCALENDAR, appInView)}
            />
        ),
    ].filter(isTruthy);

    const drawerSettingsButton = (
        <QuickSettingsAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.QUICK_SETTINGS, appInView)} />
    );

    const isNewUploadDisabled = location.pathname === '/devices' || isReadOnly;

    const sidebar = (
        <DriveSidebar
            logo={logo}
            primary={<ActionMenuButton className="no-mobile" disabled={isNewUploadDisabled} />}
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
        />
    );

    return (
        <PrivateAppContainer
            top={top}
            header={header}
            sidebar={sidebar}
            drawerApp={<DrawerApp customAppSettings={<DriveQuickSettings />} />}
        >
            <PrivateMainArea
                drawerSidebar={
                    <DrawerSidebar
                        buttons={drawerSidebarButtons}
                        spotlightSeenRef={drawerSpotlightSeenRef}
                        settingsButton={drawerSettingsButton}
                    />
                }
            >
                <div className="flex flex-column flex-nowrap w100">
                    <AppErrorBoundary>{children}</AppErrorBoundary>
                </div>
            </PrivateMainArea>
        </PrivateAppContainer>
    );
};

export default DriveWindow;
