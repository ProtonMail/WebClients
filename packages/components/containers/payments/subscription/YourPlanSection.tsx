import { useAddresses } from '@proton/account/addresses/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserInvitations } from '@proton/account/userInvitations/hooks';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import Loader from '@proton/components/components/loader/Loader';
import MozillaInfoPanel from '@proton/components/containers/account/MozillaInfoPanel';
import SettingsSectionExtraWide from '@proton/components/containers/account/SettingsSectionExtraWide';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useLoad from '@proton/components/hooks/useLoad';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import useVPNServersCount from '@proton/components/hooks/useVPNServersCount';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { pick } from '@proton/shared/lib/helpers/object';
import { getCanSubscriptionAccessDuoPlan, getHasVpnB2BPlan, isTrial } from '@proton/shared/lib/helpers/subscription';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import clsx from '@proton/utils/clsx';

import { useSubscriptionModal } from './SubscriptionModalProvider';
import { resolveUpsellsToDisplay } from './helpers';
import { SubscriptionPanel, UpsellPanels, UsagePanel } from './panels';
import PendingInvitationsPanel from './panels/PendingInvitationsPanel';

import './YourPlanSection.scss';

interface Props {
    app: APP_NAMES;
}

const YourPlanSection = ({ app }: Props) => {
    const [user] = useUser();
    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans;
    const freePlan = plansResult?.freePlan || FREE_PLAN;
    const [addresses] = useAddresses();
    const [calendars] = useCalendars();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [serversCount, serversCountLoading] = useVPNServersCount();
    const [invites = []] = useUserInvitations();
    const [openSubscriptionModal] = useSubscriptionModal();
    const canAccessDuoPlan = getCanSubscriptionAccessDuoPlan(subscription);
    const { plansMap, plansMapLoading } = usePreferredPlansMap();

    useLoad();

    const loading =
        loadingSubscription || loadingOrganization || loadingPlans || serversCountLoading || plansMapLoading;

    if (!subscription || !plans || loading) {
        return <Loader />;
    }

    const { isManagedByMozilla } = subscription;
    if (isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const upsells = resolveUpsellsToDisplay({
        app,
        subscription,
        plansMap,
        freePlan,
        serversCount,
        openSubscriptionModal,
        canAccessDuoPlan,
        user,
        ...pick(user, ['canPay', 'isFree', 'hasPaidMail']),
    });

    const isVpnB2b = getHasVpnB2BPlan(subscription);
    const isWalletEA = app === APPS.PROTONWALLET;
    // Subscription panel is displayed for user with a free or paid plan and not in a trial
    const shouldRenderSubscription = user.canPay || (subscription && !isTrial(subscription));
    const shouldRenderPendingInvitation = !!invites.length;
    // Upsell panel if the user has a subscription and is not vpn or wallet
    const shouldRenderUpsells = !isVpnB2b && !isWalletEA && shouldRenderSubscription;
    // Usage panel is displayed for members of B2B plans except VPN B2B
    const shouldRenderUsagePanel =
        (organization?.UsedMembers || 0) > 1 && !isVpnB2b && organization?.State === ORGANIZATION_STATE.ACTIVE;

    // By default, for style consistency, we display every setting in `SettingsSectionWide`
    // But since 3 panels don't fit in this section (or are too tightly packed),
    // we use the extra wide one when we have > 2 panels to display
    const panelCount = [shouldRenderSubscription, shouldRenderPendingInvitation, shouldRenderUsagePanel].filter(
        Boolean
    ).length;
    const shouldRenderInLargeSection = panelCount + upsells.length > 2;
    const SettingsSection = shouldRenderInLargeSection ? SettingsSectionExtraWide : SettingsSectionWide;

    return (
        <SettingsSection>
            <div
                className={clsx(
                    shouldRenderInLargeSection ? 'grid-column-3' : 'grid-column-2',
                    'your-plan-section-container gap-8 pt-4'
                )}
                data-testid="dashboard-panels-container"
            >
                {/* Subcription details */}
                {shouldRenderSubscription && (
                    <SubscriptionPanel
                        app={app}
                        subscription={subscription}
                        organization={organization}
                        user={user}
                        addresses={addresses}
                        vpnServers={serversCount}
                        upsells={shouldRenderUpsells ? upsells : []}
                    />
                )}

                {/* Usage for plans with >1 Members except VPN B2B */}
                {shouldRenderUsagePanel && (
                    <UsagePanel addresses={addresses} calendars={calendars} organization={organization} user={user} />
                )}
                {shouldRenderUpsells && <UpsellPanels upsells={upsells} subscription={subscription} />}
                {shouldRenderPendingInvitation && <PendingInvitationsPanel invites={invites} />}
            </div>
        </SettingsSection>
    );
};
export default YourPlanSection;
