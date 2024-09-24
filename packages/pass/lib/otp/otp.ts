import { TOTP, URI } from 'otpauth';

import type { MaybeNull, OtpCode } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { isTotpUri } from '@proton/pass/utils/url/utils';
import { getSearchParams } from '@proton/shared/lib/helpers/url';

import { PatchedSecret } from './patch';

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
export const parseOTPFromURI = (totpUri: string, options: OTPOptions): TOTP => {
    try {
        return URI.parse(totpUri) as TOTP;
    } catch (err) {
        const url = new URL(totpUri);
        const params = Object.fromEntries(url.searchParams);
        const rawSecret = params.secret?.replaceAll(INVALID_SECRET_CHARS, '');
        const secret = PatchedSecret.fromBase32(rawSecret ?? '');
        const urlIssuerAndLabel = decodeURIComponent(url.pathname.slice(1)).split(':', 2);
        const issuer = options.issuer ?? (urlIssuerAndLabel.length === 2 ? urlIssuerAndLabel[0] : null);
        const label = options.label ?? urlIssuerAndLabel[urlIssuerAndLabel.length - 1];
        const period = params.period ? parseInt(params.period, 10) : undefined;
        const digits = params.digits ? parseInt(params.digits, 10) : undefined;

        const totpOptions = merge(
            OTP_DEFAULTS,
            {
                ...params,
                digits: Number.isInteger(digits) ? digits : undefined,
                period: Number.isInteger(period) ? period : undefined,
                issuer,
                label,
                secret,
            },
            { excludeEmpty: true }
        );

        return new TOTP(totpOptions);
    }
};

export const parseOTPFromSecret = (rawSecret: string, { issuer, label }: OTPOptions): TOTP => {
    const base32Secret = decodeURIComponent(rawSecret).replace(INVALID_SECRET_CHARS, '');
    const secret = PatchedSecret.fromBase32(base32Secret);
    const totpOptions = merge(OTP_DEFAULTS, { label, issuer, secret }, { excludeEmpty: true });

    return new TOTP(totpOptions);
};

export const parseOTPValue = (uriOrSecret?: string, options: OTPOptions = {}): string => {
    try {
        if (!uriOrSecret || isEmptyString(uriOrSecret)) throw new Error('Invalid parameter');
        const totp = (isTotpUri(uriOrSecret) ? parseOTPFromURI : parseOTPFromSecret)(uriOrSecret, options);
        return totp.toString();
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

export const generateTOTPCode = (totpUri?: string): MaybeNull<OtpCode> => {
    try {
        if (!totpUri) return null;
        const otp = (isTotpUri(totpUri) ? parseOTPFromURI : parseOTPFromSecret)(totpUri, {});

        const token = otp.generate();
        const timestamp = getEpoch();
        const expiry = timestamp + otp.period - (timestamp % otp.period);

        return { token, period: otp.period, expiry };
    } catch {
        return null;
    }
};
