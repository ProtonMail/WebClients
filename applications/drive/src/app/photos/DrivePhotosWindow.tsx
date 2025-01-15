import { useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/index';
import {
    CalendarDrawerAppButton,
    ContactDrawerAppButton,
    DrawerApp,
    DrawerSidebar,
    DrawerVisibilityButton,
    PrivateAppContainer,
    PrivateMainArea,
    QuickSettingsAppButton,
    SidebarLogo,
    TopBanners,
    useDrawer,
    useOpenDrawerOnLoad,
    useToggle,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import AppErrorBoundary from '../components/AppErrorBoundary';
import FileRecoveryBanner from '../components/ResolveLockedVolumes/LockedVolumesBanner';
import DriveQuickSettings from '../components/drawer/DriveQuickSettings';
import { DriveHeaderPrivate } from '../components/layout/DriveHeader';
import { getDriveDrawerPermissions } from '../components/layout/drawerPermissions';
import { PhotosSidebar } from './PhotosSidebar/PhotosSidebar';

interface Props {
    children?: JSX.Element | JSX.Element[];
}

const DriveWindow = ({ children }: Props) => {
    const [user] = useUser();
    const { state: expanded, toggle: toggleExpanded } = useToggle();

    const [recoveryBannerVisible, setRecoveryBannerVisible] = useState(true);

    useOpenDrawerOnLoad();
    const { appInView, showDrawerSidebar } = useDrawer();

    const fileRecoveryBanner = recoveryBannerVisible ? (
        <FileRecoveryBanner
            onClose={() => {
                setRecoveryBannerVisible(false);
            }}
        />
    ) : null;

    const top = <TopBanners app={APPS.PROTONDRIVE}>{fileRecoveryBanner}</TopBanners>;

    const drawerSettingsButton = (
        <QuickSettingsAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.QUICK_SETTINGS, appInView)} />
    );

    const logo = <SidebarLogo to="/" app={APPS.PROTONDRIVE} />;
    const header = (
        <DriveHeaderPrivate
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
            settingsButton={drawerSettingsButton}
        />
    );

    const permissions = getDriveDrawerPermissions({ user });
    const drawerSidebarButtons = [
        permissions.contacts && (
            <ContactDrawerAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.CONTACTS, appInView)} />
        ),
        permissions.calendar && <CalendarDrawerAppButton aria-expanded={isAppInView(APPS.PROTONCALENDAR, appInView)} />,
    ].filter(isTruthy);

    const sidebar = (
        <PhotosSidebar
            logo={logo}
            primary={
                <a href="/">
                    <Button color="norm" size="large">
                        Go back to Drive
                    </Button>
                </a>
            }
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
            drawerApp={<DrawerApp customAppSettings={<DriveQuickSettings />} />}
        >
            <PrivateMainArea
                drawerSidebar={<DrawerSidebar buttons={drawerSidebarButtons} />}
                drawerVisibilityButton={canShowDrawer ? <DrawerVisibilityButton /> : undefined}
                mainBordered={canShowDrawer && !!showDrawerSidebar}
            >
                <div className="flex flex-column flex-nowrap w-full">
                    <AppErrorBoundary>{children}</AppErrorBoundary>
                </div>
            </PrivateMainArea>
        </PrivateAppContainer>
    );
};

export default DriveWindow;
