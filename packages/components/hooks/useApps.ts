import { COUPON_CODES, APPS } from 'proton-shared/lib/constants';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import useSubscription from './useSubscription';
import { useUser } from './useUser';

const { PROTONMAIL, PROTONCALENDAR, PROTONDRIVE } = APPS;
const { PROTONTEAM, LIFETIME, VISIONARYFOREVER } = COUPON_CODES;

const useApps = () => {
    const [subscription] = useSubscription();
    const [user] = useUser();
    const coupon = subscription?.CouponCode || ''; // CouponCode can be null
    return [
        PROTONMAIL,
        PROTONCALENDAR,
        ([PROTONTEAM, LIFETIME, VISIONARYFOREVER].includes(coupon as COUPON_CODES) || user.DriveEarlyAccess) &&
            PROTONDRIVE,
    ].filter(isTruthy);
};

export default useApps;
