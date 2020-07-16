import { HumanVerificationMethodType } from '../interfaces';

interface Headers {
    [key: string]: any;
}
interface MergeHeaderArgs {
    headers: Headers;
    [key: string]: any;
}
export const mergeHeaders = ({ headers: configHeaders, ...restConfig }: MergeHeaderArgs, headers: Headers) => ({
    ...restConfig,
    headers: {
        ...configHeaders,
        ...headers,
    },
});

export const getUIDHeaders = (UID: string) => ({
    'x-pm-uid': UID,
});

export const getAuthHeaders = (UID: string, AccessToken: string) => ({
    'x-pm-uid': UID,
    Authorization: `Bearer ${AccessToken}`,
});

export const withAuthHeaders = (UID: string, AccessToken: string, config: any) =>
    mergeHeaders(config, getAuthHeaders(UID, AccessToken));

export const getVerificationHeaders = (token?: string, tokenType?: HumanVerificationMethodType) => {
    if (!token || !tokenType) {
        return {};
    }
    return {
        'x-pm-human-verification-token': token,
        'x-pm-human-verification-token-type': tokenType,
    };
};
