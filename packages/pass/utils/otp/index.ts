import { Secret, TOTP, URI } from 'otpauth';

import { isEmptyString } from '../string';

export const OTP_DEFAULTS = {
    issuer: '',
    label: 'Proton Pass',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
};

export const parseOTPValue = (input: string, { label, issuer }: { label?: string; issuer?: string } = {}): string => {
    if (isEmptyString(input)) {
        return '';
    }

    let uri = '';
    try {
        uri = URI.parse(input).toString();
    } catch (err) {
        try {
            let maybeBase32Secret = input.split(' ').join('');
            let secret = Secret.fromBase32(maybeBase32Secret);
            const totp = new TOTP({
                ...OTP_DEFAULTS,
                ...(label !== undefined && { label }),
                ...(issuer !== undefined && { issuer }),
                secret,
            });
            return totp.toString();
        } catch (err) {
            return '';
        }
    }

    return uri;
};
