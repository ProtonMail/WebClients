import { ReactNode } from 'react';

import { APP_NAMES } from '@proton/shared/lib/constants';

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

interface Props {
    app: APP_NAMES;
    children?: ReactNode;
}

const TopBanners = ({ children, app }: Props) => {
    return (
        <>
            <DelinquentTopBanner />
            <OnlineTopBanner />
            <TimeOutOfSyncTopBanner />
            <StorageLimitTopBanner app={app} />
            <BadAppVersionBanner />
            <SubUserTopBanner />
            <DesktopNotificationTopBanner />
            <ReferralTopBanner fromApp={app} />
            <PendingInvitationTopBanner />
            <SubscriptionEndsBanner />
            <SessionRecoveryBanners />
            {children}
        </>
    );
};

export default TopBanners;
