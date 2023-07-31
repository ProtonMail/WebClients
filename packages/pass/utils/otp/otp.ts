import { Secret, TOTP, URI } from 'otpauth';

import type { MaybeNull } from '@proton/pass/types';
import { getSearchParams } from '@proton/shared/lib/helpers/url';

import { merge } from '../object';
import { isEmptyString } from '../string';
import { isTotpUri } from '../url';

export const OTP_DEFAULTS = {
    issuer: '',
    label: 'Proton Pass',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
};

export const parseOTPValue = (
    input: string,
    { label, issuer }: { label?: MaybeNull<string>; issuer?: MaybeNull<string> } = {}
): string => {
    if (isEmptyString(input)) return '';

    try {
        return URI.parse(input).toString();
    } catch (err) {
        try {
            if (isTotpUri(input)) {
                const params = getSearchParams(input.split('?')?.[1]);
                if (params.secret === undefined) return '';

                return new TOTP(
                    merge(
                        OTP_DEFAULTS,
                        {
                            ...params,
                            label,
                            issuer,
                        },
                        { excludeEmpty: true }
                    )
                ).toString();
            }

            /* remove spaces, dashes and underscores */
            let maybeBase32Secret = input.replace(/\s|-|_/g, '');
            let secret = Secret.fromBase32(maybeBase32Secret);

            return new TOTP(
                merge(
                    OTP_DEFAULTS,
                    {
                        label,
                        issuer,
                        secret,
                    },
                    { excludeEmpty: true }
                )
            ).toString();
        } catch (err) {
            return '';
        }
    }
};

export const getOPTSecret = (totpUri: string): string => {
    const params = getSearchParams(totpUri.split('?')?.[1]);
    return params.secret === undefined ? '' : params.secret;
};

/* we like to compare just algorithm: 'SHA1', digits: 6, period: 30, */
export const hasDefaultOTP = (totpUri: string): boolean => {
    const keysToCompare = ['algorithm', 'digits', 'period'] as const;
    const totpUriParams = getSearchParams(totpUri.split('?')?.[1]);
    return keysToCompare.every((key) => !(key in totpUriParams) || totpUriParams[key] === String(OTP_DEFAULTS[key]));
};

/* returns just the secret when we have defaults */
export const getSecretOrUri = (totpUri: string): string => {
    return hasDefaultOTP(totpUri) ? getOPTSecret(totpUri) : totpUri;
};
