import { getHasValentineCoupon, hasMail } from '@proton/shared/lib/helpers/subscription';
import type { Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    subscription?: Subscription;
}

export const getIsEligible = ({ user, subscription }: Props) => {
    const hasUsedValentineCoupons = getHasValentineCoupon(subscription);
    const isMailPlus = hasMail(subscription);

    return user.isPaid && !user.isDelinquent && !hasUsedValentineCoupons && isMailPlus;
};
