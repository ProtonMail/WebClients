import { c, msgid } from 'ttag';

import { ButtonLike, Card } from '@proton/atoms';
import { SettingsLink, SettingsSectionWide, usePlans, useUserVPN } from '@proton/components';
import { PLANS, VPN_CONNECTIONS } from '@proton/shared/lib/constants';

const VpnUpgradeSection = () => {
    const [plansResult, loadingPlans] = usePlans();
    const vpnPlan = plansResult?.plans?.find(({ Name }) => Name === PLANS.VPN);
    const n = vpnPlan?.MaxVPN || VPN_CONNECTIONS;

    const { result } = useUserVPN();
    const userVPN = result?.VPN;
    const currentPlanName = userVPN?.PlanName;
    const shouldUpgrade = currentPlanName === PLANS.FREE;

    if (loadingPlans || !shouldUpgrade || !vpnPlan) {
        return null;
    }

    const planName = vpnPlan.Title;

    return (
        <SettingsSectionWide>
            <Card className="flex items-center" rounded>
                <p className="m-0 mr-8 flex-1">
                    {c('Upgrade').ngettext(
                        msgid`Upgrade to ${planName} to connect up to ${n} device to the VPN at once`,
                        `Upgrade to ${planName} to connect up to ${n} devices to the VPN at once`,
                        n
                    )}
                </p>

                <ButtonLike color="norm" as={SettingsLink} path={`/dashboard?plan=${PLANS.VPN}`}>
                    {c('Action').t`Upgrade`}
                </ButtonLike>
            </Card>
        </SettingsSectionWide>
    );
};

export default VpnUpgradeSection;
