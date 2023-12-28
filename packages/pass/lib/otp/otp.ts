import { Secret, TOTP, URI } from 'otpauth';

import type { MaybeNull } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { isTotpUri } from '@proton/pass/utils/url/totp';
import { getSearchParams } from '@proton/shared/lib/helpers/url';

type OTPOptions = {
    secret?: string;
    issuer?: MaybeNull<string>;
    label?: MaybeNull<string>;
};

export const OTP_DEFAULTS = {
    issuer: '',
    label: 'Proton Pass',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
};

export const INVALID_SECRET_CHARS = /\s|-|_/g;

/** Validates a `totpUri`. If the default parser fails, will attempt to re-build
 * the totp options by parsing the supplied `totpUri` search parameters.  */
export const parseOTPFromURI = (totpUri: string, options: OTPOptions) => {
    try {
        return URI.parse(totpUri).toString();
    } catch (err) {
        const url = new URL(totpUri);
        const params = Object.fromEntries(url.searchParams);
        const secret = params.secret?.replaceAll(INVALID_SECRET_CHARS, '');
        if (!secret) throw new Error('Missing secret');

        const urlIssuerAndLabel = decodeURIComponent(url.pathname.slice(1)).split(':', 2);
        const issuer = options.issuer ?? (urlIssuerAndLabel.length === 2 ? urlIssuerAndLabel[0] : null);
        const label = options.label ?? urlIssuerAndLabel[urlIssuerAndLabel.length - 1];

        const totpOptions = merge(OTP_DEFAULTS, { ...params, secret, issuer, label }, { excludeEmpty: true });
        const totp = new TOTP(totpOptions);

        return totp.toString();
    }
};

export const parseOTPFromSecret = (rawSecret: string, { issuer, label }: OTPOptions) => {
    const base32Secret = decodeURIComponent(rawSecret).replace(INVALID_SECRET_CHARS, '');
    const secret = Secret.fromBase32(base32Secret);
    if (secret.base32.length === 0) throw new Error('Invalid secret');

    const totpOptions = merge(OTP_DEFAULTS, { label, issuer, secret }, { excludeEmpty: true });
    const totp = new TOTP(totpOptions);

    return totp.toString();
};

export const parseOTPValue = (uriOrSecret?: string, options: OTPOptions = {}): string => {
    try {
        if (!uriOrSecret || isEmptyString(uriOrSecret)) throw new Error('Invalid parameter');
        return (isTotpUri(uriOrSecret) ? parseOTPFromURI : parseOTPFromSecret)(uriOrSecret, options);
    } catch {
        return '';
    }
};

/** Checks if a `totpUri` has default configuration values
 * - algorithm: SHA1
 * - digits: 6
 * - period: 30 */
export const hasDefaultOTPOptions = (totpUri: string): boolean => {
    const keysToCompare = ['algorithm', 'digits', 'period'] as const;
    const totpUriParams = getSearchParams(totpUri.split('?')?.[1]);
    return keysToCompare.every((key) => !(key in totpUriParams) || totpUriParams[key] === String(OTP_DEFAULTS[key]));
};

/** Extracts the OTP secret from a `totpUri` string */
export const getOTPSecret = (totpUri: string): string => {
    const params = getSearchParams(totpUri.split('?')?.[1]);
    return params.secret === undefined ? '' : params.secret;
};

/** If the supplied `totpUri` has the default configuration this will return the secret */
export const getSecretOrUri = (totpUri: string): string =>
    hasDefaultOTPOptions(totpUri) ? getOTPSecret(totpUri) : totpUri;
