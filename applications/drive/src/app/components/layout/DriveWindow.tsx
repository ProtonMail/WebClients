import * as React from 'react';

import { PrivateAppContainer, useToggle, MainLogo } from '@proton/components';

import AppErrorBoundary from "../AppErrorBoundary";
import DriveHeader from "./DriveHeader";
import DriveSidebar from "./DriveSidebar/DriveSidebar";

interface Props {
    topBanners?: JSX.Element;
    PrimaryButton?: React.FunctionComponent<{ mobileVersion?: boolean }>;
    children?: JSX.Element | JSX.Element[];
}

const DriveWindow = ({ topBanners, PrimaryButton, children }: Props) => {
    const { state: expanded, toggle: toggleExpanded } = useToggle();

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
