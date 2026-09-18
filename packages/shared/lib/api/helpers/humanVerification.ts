import { API_CUSTOM_ERROR_CODES } from '../../errors';
import { getVerificationHeaders } from '../../fetch/headers';
import type { HumanVerificationMethodType } from '../../interfaces';

export const getHumanVerificationData = (error: any) => {
    const { Details: { HumanVerificationToken: token, HumanVerificationMethods: methods = [], Title: title } = {} } =
        error.data || {};

    return { token, methods, title } as {
        token: string;
        methods: HumanVerificationMethodType[];
        title: string | undefined;
    };
};

// The retry of a challenged request. An invalid token is silenced so the challenge can report it itself.
export const withVerification = (config: any, token: string, tokenType: HumanVerificationMethodType) => ({
    ...config,
    silence:
        config.silence === true
            ? true
            : [...(Array.isArray(config.silence) ? config.silence : []), API_CUSTOM_ERROR_CODES.TOKEN_INVALID],
    headers: {
        ...config.headers,
        ...getVerificationHeaders(token, tokenType),
    },
});
