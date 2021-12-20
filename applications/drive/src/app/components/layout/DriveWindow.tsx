import * as React from 'react';
import { useState } from 'react';

import { PrivateAppContainer, useToggle, MainLogo, TopBanners } from '@proton/components';

import FileRecoveryBanner from '../ResolveLockedVolumes/LockedVolumesBanner';
import AppErrorBoundary from '../AppErrorBoundary';
import DriveHeader from './DriveHeader';
import DriveSidebar from './DriveSidebar/DriveSidebar';

interface Props {
    PrimaryButton?: React.FunctionComponent<{ mobileVersion?: boolean }>;
    children?: JSX.Element | JSX.Element[];
}

const DriveWindow = ({ PrimaryButton, children }: Props) => {
    const { state: expanded, toggle: toggleExpanded } = useToggle();

    const [recoveryBannerVisible, setReoveryBannerVisible] = useState(true);

    const fileRecoveryBanner = recoveryBannerVisible ? (
        <FileRecoveryBanner
            onClose={() => {
                setReoveryBannerVisible(false);
            }}
        />
    ) : null;
    const topBanners = <TopBanners>{fileRecoveryBanner}</TopBanners>;

    const logo = <MainLogo to="/" />;
    const header = (
        <DriveHeader
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
        <PrivateAppContainer topBanners={topBanners} header={header} sidebar={sidebar}>
            <AppErrorBoundary>{children}</AppErrorBoundary>
        </PrivateAppContainer>
    );
};

export default DriveWindow;
