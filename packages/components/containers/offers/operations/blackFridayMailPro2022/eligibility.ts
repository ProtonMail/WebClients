import { APPS, PLANS } from '@proton/shared/lib/constants';
import { getPlan, hasVPNBlackFridayDiscount, isExternal } from '@proton/shared/lib/helpers/subscription';
import { Organization, ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    organization?: Organization;
    subscription?: Subscription;
    user: UserModel;
    protonConfig: ProtonConfig;
}

const isEligible = ({ user, organization, subscription, protonConfig }: Props) => {
    const { UsedMembers = 0 } = organization || {};
    const plan = getPlan(subscription);
    const isVpnApp = protonConfig.APP_NAME === APPS.PROTONVPN_SETTINGS;
    const noBFVPN = !hasVPNBlackFridayDiscount(subscription);
    const isNotExternal = !isExternal(subscription);

    return (
        [PLANS.BUNDLE, PLANS.BUNDLE_PRO, PLANS.MAIL_PRO].includes(plan?.Name as PLANS) &&
        UsedMembers <= 5 &&
        (subscription?.Amount ?? 999999) < 42000 &&
        user.canPay &&
        isNotExternal &&
        !isVpnApp &&
        !user.isDelinquent &&
        noBFVPN
    );
};

export default isEligible;
