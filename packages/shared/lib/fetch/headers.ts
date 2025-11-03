import type { HumanVerificationMethodType } from '../interfaces';

interface Headers {
    [key: string]: any;
}

interface MergeHeaderArgs {
    headers?: Headers;

    [key: string]: any;
}

export const mergeHeaders = ({ headers: configHeaders, ...restConfig }: MergeHeaderArgs, headers: Headers) => ({
    ...restConfig,
    headers: {
        ...configHeaders,
        ...headers,
    },
});

export const getAppVersionStr = (clientID: string, _appVersion: string) => {
    const appVersion = process.env.NODE_ENV !== 'production' ? `${_appVersion.replace(/-.*/, '')}-dev` : _appVersion;
    return `${clientID}@${appVersion}`;
};

export const getAppVersionHeader = (appVersion: string) => ({
    'x-pm-appversion': appVersion,
});

export const getAppVersionHeaders = (clientID: string, appVersion: string) => {
    return getAppVersionHeader(getAppVersionStr(clientID, appVersion));
};

export const getUIDHeaderValue = (headers: Headers | undefined) => headers?.['x-pm-uid'];

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

export const getOwnershipVerificationHeaders = (value: 'lax') => {
    return {
        'X-PM-OV': value,
    };
};

export const getCroHeaders = (paymentToken: string | undefined) => {
    if (!paymentToken) {
        return {};
    }
    return {
        'x-pm-payment-info-token': paymentToken,
    };
};

export const withVerificationHeaders = (
    token: string | undefined,
    tokenType: HumanVerificationMethodType | undefined,
    config: any
) => {
    return mergeHeaders(config, getVerificationHeaders(token, tokenType));
};
