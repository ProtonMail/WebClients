import { c } from 'ttag';

import { useVPNServersCount } from '@proton/account';
import { useAddresses } from '@proton/account/addresses/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { DashboardCard } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import Loader from '@proton/components/components/loader/Loader';
import SubscriptionEndsBannerV2 from '@proton/components/containers/topBanners/SubscriptionEndsBannerV2';
import useLoad from '@proton/components/hooks/useLoad';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import { CurrentPlanInfoSection } from './CurrentPlanInfoSection';

interface YourPlanSectionV2Props {
    app: APP_NAMES;
    editBillingCycle?: boolean;
}

const YourPlanSectionV2 = ({ app, editBillingCycle = false }: YourPlanSectionV2Props) => {
    const [user] = useUser();
    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans;
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [serversCount, serversCountLoading] = useVPNServersCount();
    const [addresses] = useAddresses();

    useLoad();

    const loading = loadingSubscription || loadingOrganization || loadingPlans || serversCountLoading;

    if (!subscription || !plans || loading) {
        return <Loader />;
    }

    return (
        <>
            <DashboardGrid>
                <DashboardGridSectionHeader title={c('Headline').t`Your plan`} />
                <SubscriptionEndsBannerV2 app={app} />
                <DashboardCard>
                    <DashboardCardContent>
                        <CurrentPlanInfoSection
                            app={app}
                            user={user}
                            subscription={subscription}
                            organization={organization}
                            serversCount={serversCount}
                            addresses={addresses}
                            editBillingCycle={editBillingCycle}
                        />
                    </DashboardCardContent>
                </DashboardCard>
            </DashboardGrid>
        </>
    );
};
export default YourPlanSectionV2;
