import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';

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

    return stringToUint8Array(JSON.stringify(data)).toBase64({ alphabet: 'base64url', omitPadding: true });
};

export const encodeFreeSubscriptionData = ({ hasHadSubscription }: Omit<DecodedFreeCookieData, 'type'>): string => {
    const data: EncodedFreeCookieData = {
        t: 'f',
        h: hasHadSubscription ? '1' : '0',
    };

    return stringToUint8Array(JSON.stringify(data)).toBase64({ alphabet: 'base64url', omitPadding: true });
};
