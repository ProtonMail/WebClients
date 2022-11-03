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

export const getAppVersionHeaders = (clientID: string, appVersion: string) => {
    if (process.env.NODE_ENV !== 'production') {
        appVersion = `${appVersion.replace(/-.*/, '')}-dev`;
    }
    return {
        'x-pm-appversion': `${clientID}@${appVersion}`,
    };
};

export const getUIDHeaders = (UID: string) => ({
    'x-pm-uid': UID,
});

export const getAuthHeaders = (UID: string, AccessToken: string) => ({
    'x-pm-uid': UID,
    Authorization: `Bearer ${AccessToken}`,
});

export const getLocaleHeaders = (localeCode: string) => ({
    'x-pm-locale': localeCode,
});

export const withAuthHeaders = (UID: string, AccessToken: string, config: any) =>
    mergeHeaders(config, getAuthHeaders(UID, AccessToken));

export const withUIDHeaders = (UID: string, config: any) => mergeHeaders(config, getUIDHeaders(UID));

export const withLocaleHeaders = (localeCode: string, config: any) =>
    mergeHeaders(config, getLocaleHeaders(localeCode));

export const getVerificationHeaders = (
    token: string | undefined,
    tokenType: HumanVerificationMethodType | undefined
) => {
    if (!token || !tokenType) {
        return {};
    }
    return {
        'x-pm-human-verification-token': token,
        'x-pm-human-verification-token-type': tokenType,
    };
};

export const withVerificationHeaders = (
    token: string | undefined,
    tokenType: HumanVerificationMethodType | undefined,
    config: any
) => {
    return mergeHeaders(config, getVerificationHeaders(token, tokenType));
};
