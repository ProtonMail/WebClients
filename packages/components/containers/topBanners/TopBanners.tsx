import type { ReactNode } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';

import AccessTypeTopBanner from './AccessTypeTopBanner';
import BadAppVersionBanner from './BadAppVersionBanner';
import DelinquentTopBanner from './DelinquentTopBanner';
import DesktopNotificationTopBanner from './DesktopNotificationTopBanner';
import OnlineTopBanner from './OnlineTopBanner';
import PendingInvitationTopBanner from './PendingInvitationTopBanner';
import SessionRecoveryBanners from './SessionRecoveryBanners';
import StorageLimitTopBanner from './StorageLimitTopBanner';
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
            <TrialTopBanner app={app} />
            <OnlineTopBanner />
            <TimeOutOfSyncTopBanner />
            <StorageLimitTopBanner app={app} />
            <BadAppVersionBanner />
            <AccessTypeTopBanner />
            <DesktopNotificationTopBanner />
            <PendingInvitationTopBanner />
            <SubscriptionEndsBanner app={app} />
            <SessionRecoveryBanners />
            {children}
        </>
    );
};

export default TopBanners;
