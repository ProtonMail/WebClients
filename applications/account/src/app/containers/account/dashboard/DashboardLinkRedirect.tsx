import type { ReactNode } from 'react';
import { Redirect, useLocation } from 'react-router-dom';

import type { Location } from 'history';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import PrivateMainAreaLoading from '@proton/components/containers/layout/PrivateMainAreaLoading';
import { getIsSectionAvailable } from '@proton/components/containers/layout/helper';
import type { SectionConfig } from '@proton/components/containers/layout/interface';

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
    path: string;
    children: ReactNode;
}

export function DashboardLinkRedirect({ subscription, path, children }: Props) {
    const location = useLocation();
    const [, loadingSubscription] = useSubscription();
    const [, loadingOrganization] = useOrganization();

    if (loadingSubscription || loadingOrganization) {
        return <PrivateMainAreaLoading />;
    } else if (getIsSectionAvailable(subscription) && shouldRedirectToSubscriptions(location)) {
        return <Redirect to={`${path}${subscription.to}${location.search}${location.hash}`} />;
    } else {
        return <>{children}</>;
    }
}
