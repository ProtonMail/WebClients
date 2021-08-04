import { c, msgid } from 'ttag';
import { PLANS, PLAN_NAMES, APPS_CONFIGURATION, APPS } from '@proton/shared/lib/constants';
import { ButtonLike, Card, SettingsLink, SettingsSectionWide, usePlans, useUserVPN } from '@proton/components';

const VpnUpgradeSection = () => {
    const [plans, loadingPlans] = usePlans();
    const plusVpnConnections = plans?.find(({ Name }) => Name === PLANS.VPNPLUS)?.MaxVPN || 10;

    const { result: { VPN: userVPN = {} } = {} } = useUserVPN();
    const shouldUpgrade =
        userVPN.PlanName === 'trial' || userVPN.PlanName === 'vpnbasic' || userVPN.PlanName === 'free';
    const protonVpnName = APPS_CONFIGURATION[APPS.PROTONVPN_SETTINGS].name;

    if (loadingPlans || !shouldUpgrade) {
        return null;
    }

    return (
        <SettingsSectionWide>
            <Card className="flex flex-align-items-center">
                <p className="m0 mr2 flex-item-fluid">
                    {c('Upgrade').ngettext(
                        msgid`Upgrade to ${protonVpnName} ${
                            PLAN_NAMES[PLANS.VPNPLUS]
                        } to connect up to ${plusVpnConnections} device to the VPN at once`,
                        `Upgrade to ${protonVpnName} ${
                            PLAN_NAMES[PLANS.VPNPLUS]
                        } to connect up to ${plusVpnConnections} devices to the VPN at once`,
                        plusVpnConnections
                    )}
                </p>

                <ButtonLike color="norm" as={SettingsLink} path="/dashboard?plan=vpnplus">
                    {c('Action').t`Upgrade`}
                </ButtonLike>
            </Card>
        </SettingsSectionWide>
    );
};

export default VpnUpgradeSection;
