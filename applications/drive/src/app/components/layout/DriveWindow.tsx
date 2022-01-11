import * as React from 'react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { PrivateAppContainer, useToggle, MainLogo, TopBanners } from '@proton/components';

import UploadSidebarButton from '../sections/Drive/UploadButton';
import ShareFileSidebarButton from '../sections/SharedLinks/ShareFileSidebarButton';
import EmptyTrashSidebarButton from '../sections/Trash/EmptyTrashSidebarButton';
import FileRecoveryBanner from '../ResolveLockedVolumes/LockedVolumesBanner';
import AppErrorBoundary from '../AppErrorBoundary';
import { DriveHeaderPrivate } from './DriveHeader';
import DriveSidebar from './DriveSidebar/DriveSidebar';

interface Props {
    children?: JSX.Element | JSX.Element[];
}

const DriveWindow = ({ children }: Props) => {
    const location = useLocation();
    const { state: expanded, toggle: toggleExpanded } = useToggle();

    const [recoveryBannerVisible, setReoveryBannerVisible] = useState(true);

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

    const sidebar = (
        <DriveSidebar
            logo={logo}
            primary={PrimaryButton && <PrimaryButton />}
            isHeaderExpanded={expanded}
            toggleHeaderExpanded={toggleExpanded}
        />
    );

    return (
        <PrivateAppContainer top={top} header={header} sidebar={sidebar}>
            <AppErrorBoundary>{children}</AppErrorBoundary>
        </PrivateAppContainer>
    );
};

export default DriveWindow;
