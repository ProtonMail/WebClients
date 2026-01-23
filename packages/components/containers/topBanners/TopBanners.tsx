import type { ReactNode } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';

import ErrorBoundary from '../app/ErrorBoundary';
import AccessTypeTopBanner from './AccessTypeTopBanner';
import BadAppVersionBanner from './BadAppVersionBanner';
import DesktopNotificationTopBanner from './DesktopNotificationTopBanner';
import OnlineTopBanner from './OnlineTopBanner';
import PendingInvitationTopBanner from './PendingInvitationTopBanner';
import SessionRecoveryBanners from './SessionRecoveryBanners';
import StorageLimitTopBanner from './StorageLimitTopBanner';
import SubscriptionEndsBanner from './SubscriptionEndsBanner';
import TimeOutOfSyncTopBanner from './TimeOutOfSyncTopBanner';
import TrialTopBanner from './TrialTopBanner';
import UnpaidInvoiceTopBanner from './UnpaidInvoiceTopBanner';

interface Props {
    app: APP_NAMES;
    children?: ReactNode;
}

const TopBanners = ({ children, app }: Props) => {
    return (
        <ErrorBoundary component={null}>
            <UnpaidInvoiceTopBanner />
            <TrialTopBanner app={app} />
            <OnlineTopBanner className="one-of" />
            <TimeOutOfSyncTopBanner className="one-of" />
            <StorageLimitTopBanner app={app} />
            <BadAppVersionBanner />
            <AccessTypeTopBanner />
            <DesktopNotificationTopBanner />
            <PendingInvitationTopBanner />
            <SubscriptionEndsBanner app={app} />
            <SessionRecoveryBanners />
            {children}
        </ErrorBoundary>
    );
};

export default TopBanners;
