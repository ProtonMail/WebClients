
import type {
    DecodedFreeCookieData,
    DecodedPaidCookieData,
    EncodedFreeCookieData,
    EncodedPaidCookieData,
} from './types';
import { utf8StringToUint8Array } from '@protontech/crypto/utils';

export const encodePaidSubscriptionData = ({ planName, cycle }: Omit<DecodedPaidCookieData, 'type'>): string => {
    const data: EncodedPaidCookieData = {
        t: 'p',
        p: planName,
        c: cycle,
    };

    return utf8StringToUint8Array(JSON.stringify(data)).toBase64({ alphabet: 'base64url', omitPadding: true });
};

export const encodeFreeSubscriptionData = ({ hasHadSubscription }: Omit<DecodedFreeCookieData, 'type'>): string => {
    const data: EncodedFreeCookieData = {
        t: 'f',
        h: hasHadSubscription ? '1' : '0',
    };

    return utf8StringToUint8Array(JSON.stringify(data)).toBase64({ alphabet: 'base64url', omitPadding: true });
};
