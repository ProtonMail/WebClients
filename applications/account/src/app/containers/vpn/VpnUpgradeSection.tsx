import { c, msgid } from 'ttag';
import { PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { ButtonLike, Card, SettingsLink, SettingsSectionWide, usePlans, useUserVPN } from '@proton/components';

const VpnUpgradeSection = () => {
    const [plans, loadingPlans] = usePlans();
    const plusVpnConnections = plans?.find(({ Name }) => Name === PLANS.VPNPLUS)?.MaxVPN || 10;

    const { result } = useUserVPN();
    const userVPN = result?.VPN;
    const planName = userVPN?.PlanName;
    const shouldUpgrade = planName === 'vpnbasic' || planName === 'free';

    if (loadingPlans || !shouldUpgrade) {
        return null;
    }

    const vpnPlanName = `${PLAN_NAMES[PLANS.VPN]}`;

    return (
        <SettingsSectionWide>
            <Card className="flex flex-align-items-center">
                <p className="m0 mr2 flex-item-fluid">
                    {c('Upgrade').ngettext(
                        msgid`Upgrade to ${vpnPlanName} to connect up to ${plusVpnConnections} device to the VPN at once`,
                        `Upgrade to ${vpnPlanName} to connect up to ${plusVpnConnections} devices to the VPN at once`,
                        plusVpnConnections
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
