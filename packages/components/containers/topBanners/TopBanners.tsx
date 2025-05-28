import type { ReactNode } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';

import BadAppVersionBanner from './BadAppVersionBanner';
import DelinquentTopBanner from './DelinquentTopBanner';
import DesktopNotificationTopBanner from './DesktopNotificationTopBanner';
import OnlineTopBanner from './OnlineTopBanner';
import PendingInvitationTopBanner from './PendingInvitationTopBanner';
import ReferralTopBanner from './ReferralTopBanner';
import SessionRecoveryBanners from './SessionRecoveryBanners';
import StorageLimitTopBanner from './StorageLimitTopBanner';
import SubUserTopBanner from './SubUserTopBanner';
import SubscriptionEndsBanner from './SubscriptionEndsBanner';
import TimeOutOfSyncTopBanner from './TimeOutOfSyncTopBanner';
import TrialTopBanner from './TrialTopBanner';

interface Props {
    app: APP_NAMES;
    children?: ReactNode;
}

const TopBanners = ({ children, app }: Props) => {
    return (
        <>
            <DelinquentTopBanner />
            <TrialTopBanner />
            <OnlineTopBanner />
            <TimeOutOfSyncTopBanner />
            <StorageLimitTopBanner app={app} />
            <BadAppVersionBanner />
            <SubUserTopBanner />
            <DesktopNotificationTopBanner />
            <ReferralTopBanner fromApp={app} />
            <PendingInvitationTopBanner />
            <SubscriptionEndsBanner app={app} />
            <SessionRecoveryBanners />
            {children}
        </>
    );
};

export default TopBanners;
