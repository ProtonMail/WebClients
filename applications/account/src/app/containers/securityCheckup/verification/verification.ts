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

const getInitiationCall = (method: VerificationMethod) => {
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

export const initiateVerification = async ({ api, method }: { api: Api; method: VerificationMethod }) => {
    const hvMethod = getHVMethod(method);

    try {
        await api({
            ...getInitiationCall(method),
            silence: true,
            ignoreHandler: [API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED],
        });
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

        const token = details.HumanVerificationToken;

        await Promise.all([
            api<VerificationDataResult>({ ...getVerificationDataRoute(token, hvMethod), silence: true }),
            // Automatically send the code the first time.
            api<null>(sendVerificationCode(token, hvMethod)),
        ]);

        return token;
    }
};

export const verifyCode = async ({
    token,
    code,
    api,
    method,
    call,
}: {
    token: string;
    code: string;
    api: Api;
    method: VerificationMethod;
    call: () => Promise<void>;
}) => {
    const hvMethod = getHVMethod(method);

    const silentApi = <T>(config: any) => api<T>({ ...config, silence: true });

    const { Token } = await silentApi<VerificationTokenResult>(verifyVerificationCode(token, hvMethod, code));
    await api(withVerificationHeaders(Token, hvMethod, getInitiationCall(method)));

    await call();
};

export const sendNewCode = async ({ token, api, method }: { token: string; api: Api; method: VerificationMethod }) => {
    const hvMethod = getHVMethod(method);

    await api(sendVerificationCode(token, hvMethod));
};
