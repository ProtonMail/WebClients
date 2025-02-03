import { getHasValentineCoupon, hasVPN, hasVPN2024 } from '@proton/shared/lib/helpers/subscription';
import type { Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    subscription?: Subscription;
}

export const getIsEligible = ({ user, subscription }: Props) => {
    const hasUsedValentineCoupons = getHasValentineCoupon(subscription);
    const isVPNPlus = hasVPN(subscription);
    const isVPNPlus2024 = hasVPN2024(subscription);

    return user.isPaid && !user.isDelinquent && !hasUsedValentineCoupons && (isVPNPlus2024 || isVPNPlus);
};
