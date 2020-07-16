import { encode } from 'hi-base32';
import getRandomValues from 'get-random-values';

export const generateSharedSecret = (length = 20) => {
    const randomBytes = getRandomValues(new Uint8Array(length));
    return encode(randomBytes);
};

interface GetUriArguments {
    identifier: string;
    sharedSecret: string;
    issuer?: string;
    digits?: number;
    algorithm?: string;
    period?: number;
}
export const getUri = ({
    identifier,
    sharedSecret,
    issuer = 'ProtonMail',
    digits = 6,
    algorithm = 'SHA1',
    period = 30,
}: GetUriArguments) => {
    return `otpauth://totp/${identifier}?secret=${sharedSecret}&issuer=${issuer}&algorithm=${algorithm}&digits=${digits}&period=${period}`;
};
