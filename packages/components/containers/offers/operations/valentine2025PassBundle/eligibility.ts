import { getHasValentineCoupon, hasPass } from '@proton/shared/lib/helpers/subscription';
import type { Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    subscription?: Subscription;
}

export const getIsEligible = ({ user, subscription }: Props) => {
    const hasUsedValentineCoupons = getHasValentineCoupon(subscription);
    const isPassPlus = hasPass(subscription);

    return user.isPaid && !user.isDelinquent && !hasUsedValentineCoupons && isPassPlus;
};
