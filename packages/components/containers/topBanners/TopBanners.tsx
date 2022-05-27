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
import { PrivateWelcomeV5TopBanner } from './WelcomeV5TopBanner';

interface Props {
    children?: ReactNode;
}

const TopBanners = ({ children }: Props) => {
    return (
        <>
            <PrivateWelcomeV5TopBanner />
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
