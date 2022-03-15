import { ReactNode } from 'react';

import BadAppVersionBanner from './BadAppVersionBanner';
import DelinquentTopBanner from './DelinquentTopBanner';
import StorageLimitTopBanner from './StorageLimitTopBanner';
import OnlineTopBanner from './OnlineTopBanner';
import SubUserTopBanner from './SubUserTopBanner';
import DesktopNotificationTopBanner from './DesktopNotificationTopBanner';
import TimeOutOfSyncTopBanner from './TimeOutOfSyncTopBanner';
import ReferralTopBanner from './ReferralTopBanner';

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
            {children}
        </>
    );
};

export default TopBanners;
