import { ReactNode } from 'react';

import BadAppVersionBanner from './BadAppVersionBanner';
import DelinquentTopBanner from './DelinquentTopBanner';
import DesktopNotificationTopBanner from './DesktopNotificationTopBanner';
import DriveReleaseTopBanner from './DriveReleaseTopBanner';
import OnlineTopBanner from './OnlineTopBanner';
import ReferralTopBanner from './ReferralTopBanner';
import StorageLimitTopBanner from './StorageLimitTopBanner';
import SubUserTopBanner from './SubUserTopBanner';
import TimeOutOfSyncTopBanner from './TimeOutOfSyncTopBanner';

interface Props {
    children?: ReactNode;
}

const TopBanners = ({ children }: Props) => {
    return (
        <>
            <DelinquentTopBanner />
            <OnlineTopBanner />
            <TimeOutOfSyncTopBanner />
            <StorageLimitTopBanner />
            <BadAppVersionBanner />
            <SubUserTopBanner />
            <DesktopNotificationTopBanner />
            <ReferralTopBanner />
            <DriveReleaseTopBanner />
            {children}
        </>
    );
};

export default TopBanners;
