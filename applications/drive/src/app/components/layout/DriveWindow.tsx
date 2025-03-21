import { useState } from 'react';
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
    SidebarLogo,
    TopBanners,
    useDrawer,
    useOpenDrawerOnLoad,
    useToggle,
} from '@proton/components';
import DrawerApp from '@proton/components/components/drawer/DrawerApp';
import useAllowedProducts from '@proton/components/containers/organization/accessControl/useAllowedProducts';
import { Product } from '@proton/shared/lib/ProductEnum';
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
import DriveSidebar from './sidebar/DriveSidebar';

interface Props {
    children?: JSX.Element | JSX.Element[];
}

const DriveWindow = ({ children }: Props) => {
    const location = useLocation();
    const [user] = useUser();
    const { state: expanded, toggle: toggleExpanded } = useToggle();
    const [recoveryBannerVisible, setRecoveryBannerVisible] = useState(true);
    const { isReadOnly } = useIsActiveLinkReadOnly();
    useOpenDrawerOnLoad();
    const { appInView, showDrawerSidebar } = useDrawer();

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
        permissions.calendar && allowedProducts.has(Product.Calendar) && (
            <CalendarDrawerAppButton
                aria-expanded={isAppInView(APPS.PROTONCALENDAR, appInView)}
                disabled={loadingAllowedProducts}
            />
        ),
    ].filter(isTruthy);

    const isNewUploadDisabled = location.pathname === '/devices' || isReadOnly;

    const sidebar = (
        <DriveSidebar
            logo={logo}
            isNewUploadDisabled={isNewUploadDisabled || false}
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
