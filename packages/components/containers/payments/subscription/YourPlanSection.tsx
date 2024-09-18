import Loader from '@proton/components/components/loader/Loader';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { pick } from '@proton/shared/lib/helpers/object';
import { getCanSubscriptionAccessDuoPlan, getHasVpnB2BPlan, isTrial } from '@proton/shared/lib/helpers/subscription';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import clsx from '@proton/utils/clsx';

import {
    useAddresses,
    useCalendars,
    useLoad,
    useOrganization,
    usePendingUserInvitations,
    usePlans,
    usePreferredPlansMap,
    useSubscription,
    useUser,
    useVPNServersCount,
} from '../../../hooks';
import { SettingsSectionExtraWide, SettingsSectionWide } from '../../account';
import MozillaInfoPanel from '../../account/MozillaInfoPanel';
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
    const [invites = []] = usePendingUserInvitations();
    const [openSubscriptionModal] = useSubscriptionModal();
    const canAccessDuoPlan = getCanSubscriptionAccessDuoPlan(subscription);
    const { plansMap } = usePreferredPlansMap();

    useLoad();

    const loading = loadingSubscription || loadingOrganization || loadingPlans || serversCountLoading;

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
