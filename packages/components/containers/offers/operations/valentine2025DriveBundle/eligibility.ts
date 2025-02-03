import { getHasValentineCoupon, hasDrive } from '@proton/shared/lib/helpers/subscription';
import type { Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    subscription?: Subscription;
}

export const getIsEligible = ({ user, subscription }: Props) => {
    const hasUsedValentineCoupons = getHasValentineCoupon(subscription);
    const isDrivePlus = hasDrive(subscription);

    return user.isPaid && !user.isDelinquent && !hasUsedValentineCoupons && isDrivePlus;
};
