import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { ButtonLike, Card } from '@proton/atoms';
import { SettingsLink, SettingsSectionWide, usePlans } from '@proton/components';
import { PLANS, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { canPay, isPaid } from '@proton/shared/lib/user/helpers';

const VpnUpgradeSection = () => {
    const [user] = useUser();
    const [plansResult] = usePlans();
    const targetPlan = PLANS.VPN2024;
    const vpnPlan = plansResult?.plans?.find(({ Name }) => Name === targetPlan);
    const n = vpnPlan?.MaxVPN || VPN_CONNECTIONS;

    // Only showing this for free users, otherwise it'd need extra work to determine the correct upsell
    if (!vpnPlan || isPaid(user) || !canPay(user)) {
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

                <ButtonLike color="norm" as={SettingsLink} path={`/dashboard?plan=${targetPlan}`}>
                    {c('Action').t`Upgrade`}
                </ButtonLike>
            </Card>
        </SettingsSectionWide>
    );
};

export default VpnUpgradeSection;
