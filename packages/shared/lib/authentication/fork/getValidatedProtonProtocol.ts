import type { APP_NAMES } from '../../constants';

export const getValidatedProtonProtocolRedirect = (redirect: string | null | undefined) => {
    return redirect && /^proton-?(vpn|mail|calendar|drive|pass|lumo|meet|wallet|spaces)?:\/\//.test(redirect)
        ? redirect
        : undefined;
};

export const getValidatedProtonProtocol = (app: APP_NAMES, redirectUrl: string) => {
    const protocol = redirectUrl.match(/^([^:]+:)\/\//)?.[1];
    if (!protocol) {
        return;
    }
    if (getValidatedProtonProtocolRedirect(`${protocol}//`)) {
        return protocol;
    }
};
