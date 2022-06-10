import { ReactNode } from 'react';

import BadAppVersionBanner from './BadAppVersionBanner';
import DelinquentTopBanner from './DelinquentTopBanner';
import StorageLimitTopBanner from './StorageLimitTopBanner';
import OnlineTopBanner from './OnlineTopBanner';
import SubUserTopBanner from './SubUserTopBanner';
import DesktopNotificationTopBanner from './DesktopNotificationTopBanner';
import TimeOutOfSyncTopBanner from './TimeOutOfSyncTopBanner';
import ReferralTopBanner from './ReferralTopBanner';
import NudgeTopBanner from './NudgeTopBanner';

interface Props {
    children?: ReactNode;
}

const TopBanners = ({ children }: Props) => {
    return (
        <>
            <NudgeTopBanner />
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
