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
    if (isEmptyString(input)) {
        return '';
    }

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

            let maybeBase32Secret = input.split(' ').join('');
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
