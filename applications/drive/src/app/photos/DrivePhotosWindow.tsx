import { useState } from 'react';

import { Button } from '@proton/atoms/index';
import {
    DrawerApp,
    DrawerSidebar,
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

import AppErrorBoundary from '../components/AppErrorBoundary';
import FileRecoveryBanner from '../components/ResolveLockedVolumes/LockedVolumesBanner';
import DriveQuickSettings from '../components/drawer/DriveQuickSettings';
import { DriveHeaderPrivate } from '../components/layout/DriveHeader';
import { PhotosSidebar } from './PhotosSidebar/PhotosSidebar';

interface Props {
    children?: JSX.Element | JSX.Element[];
}

const DriveWindow = ({ children }: Props) => {
    const { state: expanded, toggle: toggleExpanded } = useToggle();

    const [recoveryBannerVisible, setRecoveryBannerVisible] = useState(true);

    useOpenDrawerOnLoad();
    const { appInView } = useDrawer();

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

    return (
        <PrivateAppContainer
            top={top}
            header={header}
            sidebar={sidebar}
            drawerApp={<DrawerApp customAppSettings={<DriveQuickSettings />} />}
        >
            <PrivateMainArea
                drawerSidebar={<DrawerSidebar buttons={[]} />}
                drawerVisibilityButton={undefined}
                mainBordered={false}
            >
                <div className="flex flex-column flex-nowrap w-full">
                    <AppErrorBoundary>{children}</AppErrorBoundary>
                </div>
            </PrivateMainArea>
        </PrivateAppContainer>
    );
};

export default DriveWindow;
