import { encodeBase64URL } from '@proton/shared/lib/helpers/encoding';

import type {
    DecodedFreeCookieData,
    DecodedPaidCookieData,
    EncodedFreeCookieData,
    EncodedPaidCookieData,
} from './types';

export const encodePaidSubscriptionData = ({ planName, cycle }: Omit<DecodedPaidCookieData, 'type'>): string => {
    const data: EncodedPaidCookieData = {
        t: 'p',
        p: planName,
        c: cycle,
    };

    return encodeBase64URL(JSON.stringify(data));
};

export const encodeFreeSubscriptionData = ({ hasHadSubscription }: Omit<DecodedFreeCookieData, 'type'>): string => {
    const data: EncodedFreeCookieData = {
        t: 'f',
        h: hasHadSubscription ? '1' : '0',
    };

    return encodeBase64URL(JSON.stringify(data));
};
