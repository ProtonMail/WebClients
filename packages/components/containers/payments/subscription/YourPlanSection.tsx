import usePendingUserInvitations from '@proton/components/hooks/usePendingUserInvitations';
import { APP_NAMES } from '@proton/shared/lib/constants';
import { pick } from '@proton/shared/lib/helpers/object';
import { getHasVpnB2BPlan } from '@proton/shared/lib/helpers/subscription';
import clsx from '@proton/utils/clsx';

import { Loader } from '../../../components';
import {
    useAddresses,
    useCalendars,
    useLoad,
    useOrganization,
    usePlans,
    useSubscription,
    useUser,
    useVPNServersCount,
} from '../../../hooks';
import { SettingsSectionExtraWide, SettingsSectionWide } from '../../account';
import MozillaInfoPanel from '../../account/MozillaInfoPanel';
import { useSubscriptionModal } from './SubscriptionModalProvider';
// The import below is used for the docs
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type UpgradeVpnSection from './UpgradeVpnSection';
import { getCurrency, resolveUpsellsToDisplay } from './helpers';
import { SubscriptionPanel, UpsellPanels, UsagePanel } from './panels';
import PendingInvitationsPanel from './panels/PendingInvitationsPanel';

import './YourPlanSection.scss';

interface Props {
    app: APP_NAMES;
}

const YourPlanSection = ({ app }: Props) => {
    const [user] = useUser();
    const [plans = [], loadingPlans] = usePlans();
    const [addresses] = useAddresses();
    const [calendars] = useCalendars();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [vpnServers] = useVPNServersCount();
    const [invites = []] = usePendingUserInvitations();
    const [openSubscriptionModal] = useSubscriptionModal();

    useLoad();

    const loading = loadingSubscription || loadingOrganization || loadingPlans;

    if (loading) {
        return <Loader />;
    }

    const { isManagedByMozilla } = subscription;

    if (isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const currency = getCurrency(user, subscription, plans);
    const upsells = resolveUpsellsToDisplay({
        app,
        currency,
        subscription,
        plans,
        openSubscriptionModal,
        ...pick(user, ['canPay', 'isFree', 'hasPaidMail']),
    });
    /**
     * for VPN B2B, we display the upsells in {@link UpgradeVpnSection}
     */
    const shouldRenderUpsells = !getHasVpnB2BPlan(subscription);

    const shouldRenderPendingInvitation = Boolean(invites.length);
    const shouldRenderUsagePanel = organization.UsedMembers > 1;

    const totalPanelsToDisplay = 1 + (+shouldRenderPendingInvitation || upsells.length) + +shouldRenderUsagePanel;

    // By default, for style consistency, we display every setting in `SettingsSectionWide`
    // But since 3 panels don't fit in this section (or are too tightly packed),
    // we use the extra wide one when we have > 2 panels to display
    const shouldRenderInLargeSection = totalPanelsToDisplay > 2;
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
                <SubscriptionPanel
                    app={app}
                    currency={currency}
                    subscription={subscription}
                    organization={organization}
                    user={user}
                    addresses={addresses}
                    vpnServers={vpnServers}
                    openSubscriptionModal={openSubscriptionModal}
                />

                {/* Usage for plans with >1 Members */}
                {shouldRenderUsagePanel && (
                    <UsagePanel addresses={addresses} calendars={calendars} organization={organization} user={user} />
                )}

                {/* Either display pending invitations if any, or upsell(s) */}
                {shouldRenderPendingInvitation ? (
                    <PendingInvitationsPanel invites={invites} />
                ) : shouldRenderUpsells ? (
                    <UpsellPanels upsells={upsells} subscription={subscription} />
                ) : null}
            </div>
        </SettingsSection>
    );
};
export default YourPlanSection;
