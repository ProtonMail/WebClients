import { type ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { useUser } from '@proton/account/user/hooks';
import {
    CalendarDrawerAppButton,
    ContactDrawerAppButton,
    DrawerSidebar,
    DrawerVisibilityButton,
    PrivateAppContainer,
    PrivateMainArea,
    QuickSettingsAppButton,
    ReferralAppButton,
    TopBanners,
    useDrawer,
    useOpenDrawerOnLoad,
} from '@proton/components';
import useToggle from '@proton/hooks/useToggle'
import DrawerApp from '@proton/components/components/drawer/DrawerApp';
import LumoDrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/LumoDrawerAppButton';
import useAllowedProducts from '@proton/components/containers/organization/accessControl/useAllowedProducts';
import { useFlagsDriveLumo } from '@proton/drive/modules/flags';
import { Product } from '@proton/shared/lib/ProductEnum';
import { APPS } from '@proton/shared/lib/constants';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { useIsActiveLinkReadOnly } from '../../../legacy/store/_views/utils';
import LumoDriveProvider from '../../../lumo/provider/LumoDriveProvider';
import { DriveSidebar } from '../../../sections/sidebar/DriveSidebar';
import AppErrorBoundary from '../AppErrorBoundary';
import FileRecoveryBanner from '../ResolveLockedVolumes/LockedVolumesBanner';
import DriveQuickSettings from '../drawer/DriveQuickSettings';
import { getDriveDrawerPermissions } from './drawerPermissions';
import { DriveHeaderPrivate } from './header/DriveHeaderPrivate';

const DriveWindow = ({ children }: { children: ReactNode }) => {
    const location = useLocation();
    const [user] = useUser();
    const { state: expanded, toggle: toggleExpanded } = useToggle();
    const [recoveryBannerVisible, setRecoveryBannerVisible] = useState(true);
    const { isReadOnly } = useIsActiveLinkReadOnly();
    useOpenDrawerOnLoad();
    const { appInView, showDrawerSidebar } = useDrawer();
    const { isDriveLumoEnabled } = useFlagsDriveLumo();

    const [allowedProducts, loadingAllowedProducts] = useAllowedProducts();

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
        permissions.calendar && allowedProducts.has(Product.Calendar) && (
            <CalendarDrawerAppButton
                aria-expanded={isAppInView(APPS.PROTONCALENDAR, appInView)}
                disabled={loadingAllowedProducts}
            />
        ),
        isDriveLumoEnabled ? (
            <LumoDrawerAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.LUMO, appInView)} />
        ) : undefined,
        <ReferralAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.REFERRAL, appInView)} />,
    ].filter(isTruthy);

    const isNewUploadDisabled = location.pathname === '/devices' || isReadOnly;

    const sidebar = (
        <DriveSidebar
            isNewUploadDisabled={isNewUploadDisabled || false}
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
        />
    );

    const canShowDrawer = drawerSidebarButtons.length > 0;

    const content = (
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

    // Mounted above the drawer so the Lumo conversation survives drawer tab switches and open/close.
    return isDriveLumoEnabled ? <LumoDriveProvider>{content}</LumoDriveProvider> : content;
};

export default DriveWindow;
