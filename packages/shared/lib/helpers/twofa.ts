import { base32 } from '@scure/base';

export const generateSharedSecret = (length = 20) => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    return base32.encode(randomBytes);
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
