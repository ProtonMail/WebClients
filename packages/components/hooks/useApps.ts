import { COUPON_CODES, APPS } from 'proton-shared/lib/constants';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import useSubscription from './useSubscription';

const { PROTONMAIL, PROTONCONTACTS, PROTONCALENDAR, PROTONDRIVE } = APPS;
const { PROTONTEAM, LIFETIME, VISIONARYFOREVER } = COUPON_CODES;

const useApps = () => {
    const [subscription] = useSubscription();
    const coupon = subscription?.CouponCode || ''; // CouponCode can be null
    return [
        PROTONMAIL,
        PROTONCONTACTS,
        PROTONCALENDAR,
        [PROTONTEAM, LIFETIME, VISIONARYFOREVER].includes(coupon as COUPON_CODES) && PROTONDRIVE,
    ].filter(isTruthy);
};

export default useApps;
