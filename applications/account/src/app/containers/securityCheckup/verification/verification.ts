import type { VerificationDataResult, VerificationTokenResult } from '@proton/components';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import {
    getVerificationDataRoute,
    sendVerificationCode,
    verifyVerificationCode,
} from '@proton/shared/lib/api/verification';
import { postVerifyEmail, postVerifyPhone } from '@proton/shared/lib/api/verify';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { withVerificationHeaders } from '@proton/shared/lib/fetch/headers';
import type { Api } from '@proton/shared/lib/interfaces';

export type VerificationMethod = 'email' | 'phone';

export const getInitiationCall = (method: VerificationMethod) => {
    if (method === 'email') {
        return postVerifyEmail();
    }

    return postVerifyPhone();
};

const getHVMethod = (method: VerificationMethod) => {
    if (method === 'email') {
        return 'ownership-email';
    }

    return 'ownership-sms';
};

export const initiateVerification = async ({
    api,
    method,
    config,
}: {
    api: Api;
    method: VerificationMethod;
    config: {
        url: string;
        method: string;
    };
}) => {
    const hvMethod = getHVMethod(method);

    try {
        await api({
            ...config,
            silence: true,
            ignoreHandler: [API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED],
        });

        throw new Error();
    } catch (error) {
        const { code, details } = getApiError(error);

        if (code !== API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED) {
            throw new Error();
        }

        if (
            !Array.isArray(details.HumanVerificationMethods) ||
            !details.HumanVerificationMethods.includes(hvMethod) ||
            !details.HumanVerificationToken
        ) {
            throw new Error();
        }

        const token = details.HumanVerificationToken as string;

        const [verificationDataResult] = await Promise.all([
            api<VerificationDataResult>({ ...getVerificationDataRoute(token, hvMethod), silence: true }),
            // Automatically send the code the first time.
            api<null>(sendVerificationCode(token, hvMethod)),
        ]);

        return { verificationDataResult, token };
    }
};

export const verifyCode = async ({
    token,
    code,
    api,
    method,
    config,
}: {
    token: string;
    code: string;
    api: Api;
    method: VerificationMethod;
    config: {
        url: string;
        method: string;
    };
}) => {
    const hvMethod = getHVMethod(method);

    const silentApi = <T>(config: any) => api<T>({ ...config, silence: true });

    const { Token } = await silentApi<VerificationTokenResult>(verifyVerificationCode(token, hvMethod, code));
    await api(withVerificationHeaders(Token, hvMethod, config));
};

export const sendNewCode = async ({ token, api, method }: { token: string; api: Api; method: VerificationMethod }) => {
    const hvMethod = getHVMethod(method);

    await api(sendVerificationCode(token, hvMethod));
};
