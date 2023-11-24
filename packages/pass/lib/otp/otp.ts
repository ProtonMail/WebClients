import { Secret, TOTP, URI } from 'otpauth';

import type { MaybeNull } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { isTotpUri } from '@proton/pass/utils/url/totp';
import { getSearchParams } from '@proton/shared/lib/helpers/url';

export const OTP_DEFAULTS = {
    issuer: '',
    label: 'Proton Pass',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
};

export const INVALID_SECRET_CHARS = /\s|-|_/g;

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
                const url = new URL(input);
                const params = Object.fromEntries(url.searchParams);
                const secret = params.secret?.replaceAll(INVALID_SECRET_CHARS, '');
                if (!secret) return '';

                const urlIssuerAndLabel = decodeURIComponent(url.pathname.slice(1)).split(':', 2);

                return new TOTP(
                    merge(
                        OTP_DEFAULTS,
                        {
                            ...params,
                            secret,
                            issuer: issuer ?? (urlIssuerAndLabel.length === 2 ? urlIssuerAndLabel[0] : null),
                            label: label ?? urlIssuerAndLabel[urlIssuerAndLabel.length - 1],
                        },
                        { excludeEmpty: true }
                    )
                ).toString();
            }

            /* remove spaces, dashes and underscores */
            let maybeBase32Secret = decodeURIComponent(input).replace(INVALID_SECRET_CHARS, '');
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
