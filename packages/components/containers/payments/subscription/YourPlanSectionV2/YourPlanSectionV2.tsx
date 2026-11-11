import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { FREE_SUBSCRIPTION } from '@proton/payments/core/constants';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import Loader from '../../../../components/loader/Loader';
import useLoad from '../../../../hooks/useLoad';
import ReferralTrialInfoDashboardV2 from '../../../referral/components/ReferralTrialInfo/ReferralTrialInfoDashboardV2';
import SubscriptionEndsBannerV2 from '../../../topBanners/SubscriptionEndsBannerV2';
import { getSubscriptionWithEndsBanner } from '../../../topBanners/useSubscriptionWithEndsBanner';
import { CurrentPlanInfoSection, EverySubscriptionInfoSection } from './CurrentPlanInfoSection';

interface YourPlanSectionV2Props {
    app: APP_NAMES;
    editBillingCycle?: boolean;
    cta?: ReactNode;
}

const YourPlanSectionV2 = ({ app, editBillingCycle = false, cta }: YourPlanSectionV2Props) => {
    const [user] = useUser();
    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans;
    const [subscriptions, loadingSubscriptions] = useAllSubscriptions();
    const [organization, loadingOrganization] = useOrganization();
    const [addresses] = useAddresses();

    useLoad();

    const loading = loadingSubscriptions || loadingOrganization || loadingPlans;

    if (!subscriptions || !plans || loading) {
        return <Loader />;
    }

    const soonestEndingSubscription = getSubscriptionWithEndsBanner(subscriptions);

    return (
        <>
            <DashboardGrid>
                <DashboardGridSectionHeader title={c('Headline').t`Your plan`} cta={cta} />
                <SubscriptionEndsBannerV2 app={app} subscription={soonestEndingSubscription ?? FREE_SUBSCRIPTION} />
                <DashboardCard>
                    <DashboardCardContent>
                        {subscriptions.length > 1 ? (
                            <EverySubscriptionInfoSection
                                app={app}
                                user={user}
                                subscriptions={subscriptions}
                                organization={organization}
                                addresses={addresses}
                                editBillingCycle={editBillingCycle}
                            />
                        ) : (
                            <CurrentPlanInfoSection
                                app={app}
                                user={user}
                                subscription={subscriptions[0] ?? FREE_SUBSCRIPTION}
                                organization={organization}
                                addresses={addresses}
                                editBillingCycle={editBillingCycle}
                            />
                        )}
                    </DashboardCardContent>
                </DashboardCard>
                <ReferralTrialInfoDashboardV2 />
            </DashboardGrid>
        </>
    );
};
export default YourPlanSectionV2;
