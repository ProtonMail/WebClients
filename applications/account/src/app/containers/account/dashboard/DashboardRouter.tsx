import { Redirect, useLocation } from 'react-router-dom';

import type { Location } from 'history';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import AccountDashboard from '@proton/components/containers/account/dashboard/dashboard';
import PrivateMainAreaLoading from '@proton/components/containers/layout/PrivateMainAreaLoading';
import { getIsSectionAvailable } from '@proton/components/containers/layout/helper';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import DashboardTelemetry from '@proton/components/containers/payments/subscription/DashboardTelemetry';
import { AutomaticSubscriptionModal } from '@proton/payments-ui/ui/subscriptions/AutomaticSubscriptionModal';
import type { APP_NAMES } from '@proton/shared/lib/constants';

const shouldRedirectToSubscriptions = (location: Location<unknown>) => {
    /**
     * Dashboard -> Subscription redirect to handle sections we moved from Dashboard to subscriptions page
     */
    if (location.hash) {
        return [
            '#your-subscriptions',
            '#payment-methods',
            '#credits',
            '#gift-code',
            '#invoices',
            '#email-subscription',
            '#cancel-subscription',
        ].includes(location.hash);
    }
};

interface Props {
    subscription: SectionConfig;
    dashboard: SectionConfig;
    path: string;
    app: APP_NAMES;
}

export function DashboardRouter({ subscription, dashboard, path, app }: Props) {
    const location = useLocation();
    const [, loadingSubscription] = useSubscription();
    const [, loadingOrganization] = useOrganization();

    if (loadingSubscription || loadingOrganization) {
        return <PrivateMainAreaLoading />;
    } else if (getIsSectionAvailable(subscription) && shouldRedirectToSubscriptions(location)) {
        return <Redirect to={`${path}${subscription.to}${location.search}${location.hash}`} />;
    } else {
        return (
            <>
                <DashboardTelemetry app={app} />
                <AutomaticSubscriptionModal />
                <AccountDashboard app={app} config={dashboard} />
            </>
        );
    }
}
