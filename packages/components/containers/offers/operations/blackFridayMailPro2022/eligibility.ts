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
    const { MaxMembers = 0 } = organization || {};
    const plan = getPlan(subscription);
    const isValidApp =
        protonConfig?.APP_NAME === APPS.PROTONMAIL ||
        protonConfig?.APP_NAME === APPS.PROTONACCOUNT ||
        protonConfig?.APP_NAME === APPS.PROTONACCOUNTLITE;
    const noBFVPN = !hasVPNBlackFridayDiscount(subscription);
    const isNotExternal = !isExternal(subscription);

    return (
        [PLANS.BUNDLE, PLANS.BUNDLE_PRO, PLANS.MAIL_PRO].includes(plan?.Name as PLANS) &&
        MaxMembers <= 5 &&
        (subscription?.RenewAmount ?? 999999) < 42000 &&
        user.canPay &&
        isNotExternal &&
        isValidApp &&
        !user.isDelinquent &&
        noBFVPN
    );
};

export default isEligible;
