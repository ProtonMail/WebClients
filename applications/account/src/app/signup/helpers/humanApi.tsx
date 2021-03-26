import React from 'react';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';
import { getVerificationHeaders } from 'proton-shared/lib/fetch/headers';
import { Api, HumanVerificationMethodType } from 'proton-shared/lib/interfaces';
import { HumanVerificationModal } from 'react-components';

interface ExtraArguments {
    api: Api;
    createModal: any;
    onToken: (token: string, tokenType: HumanVerificationMethodType) => void;
    verificationToken?: string;
    verificationTokenType?: HumanVerificationMethodType;
}

/**
 * Special human api handling for the signup since the human verification code needs to be triggered and included
 * in possibly multiple api requests.
 */
const humanApiHelper = <T,>(
    config: any,
    { api, createModal, verificationToken, verificationTokenType, onToken }: ExtraArguments
): Promise<T> => {
    return api<T>({
        silence: [API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED],
        ...config,
        headers: {
            ...config.headers,
            ...getVerificationHeaders(verificationToken, verificationTokenType),
        },
        ignoreHandler: [API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED],
    }).catch((error: any) => {
        if (
            error.data?.Code !== API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED ||
            config.ignoreHandler?.includes(API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED)
        ) {
            throw error;
        }

        const onVerify = (token: string, tokenType: HumanVerificationMethodType): Promise<T> => {
            return api<T>({
                ...config,
                headers: {
                    ...config.headers,
                    ...getVerificationHeaders(token, tokenType),
                },
                ignoreHandler: [API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED],
                silence: [API_CUSTOM_ERROR_CODES.TOKEN_INVALID],
            })
                .then((result: T) => {
                    onToken(token, tokenType);
                    return result;
                })
                .catch((error) => {
                    const Code = error?.data?.Code;
                    if (Code && Code !== API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                        onToken(token, tokenType);
                    }
                    throw error;
                });
        };

        const handleVerification = ({ token, methods, onVerify }: any): Promise<T> => {
            return new Promise((resolve, reject) => {
                createModal(
                    <HumanVerificationModal<T>
                        token={token}
                        methods={methods}
                        onVerify={onVerify}
                        onSuccess={resolve}
                        onError={reject}
                        onClose={() => reject(error)}
                    />
                );
            });
        };

        const { Details: { HumanVerificationToken = '', HumanVerificationMethods: methods = [] } = {} } =
            error.data || {};

        return handleVerification({ token: HumanVerificationToken, methods, onVerify });
    });
};

const createHumanApi = ({ api, createModal }: { api: Api; createModal: (node: React.ReactNode) => void }) => {
    let verificationsTokens:
        | undefined
        | { verificationToken: string; verificationTokenType: HumanVerificationMethodType };

    const clearToken = () => {
        verificationsTokens = undefined;
    };

    const setToken = (token: string, tokenType: HumanVerificationMethodType) => {
        verificationsTokens = {
            verificationToken: token,
            verificationTokenType: tokenType,
        };
    };

    const humanApiCaller = <T,>(config: any) =>
        humanApiHelper<T>(config, {
            api,
            createModal,
            ...verificationsTokens,
            onToken: setToken,
        });

    return {
        api: humanApiCaller,
        setToken,
        clearToken,
    };
};

export type HumanApi = ReturnType<typeof createHumanApi>;

export default createHumanApi;
