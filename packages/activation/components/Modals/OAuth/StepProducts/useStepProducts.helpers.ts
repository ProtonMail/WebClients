import {
    G_OAUTH_SCOPE_CALENDAR,
    G_OAUTH_SCOPE_CONTACTS,
    G_OAUTH_SCOPE_DEFAULT,
    G_OAUTH_SCOPE_MAIL,
    G_OAUTH_SCOPE_MAIL_NEW_SCOPE,
    O_OAUTH_SCOPE_CALENDAR,
    O_OAUTH_SCOPE_CONTACTS,
    O_OAUTH_SCOPE_DEFAULT,
    O_OAUTH_SCOPE_MAIL,
} from '@proton/activation/constants';
import { ImportProvider, ImportType } from '@proton/activation/interface';
import isTruthy from '@proton/utils/isTruthy';

const getGoogleScopes = (products?: ImportType[], useGmailNewScope?: boolean) => {
    const scopes = [...G_OAUTH_SCOPE_DEFAULT];

    if (products?.includes(ImportType.MAIL)) {
        if (useGmailNewScope) {
            scopes.push(...G_OAUTH_SCOPE_MAIL_NEW_SCOPE);
        } else {
            scopes.push(...G_OAUTH_SCOPE_MAIL);
        }
    }
    if (products?.includes(ImportType.CALENDAR)) {
        scopes.push(...G_OAUTH_SCOPE_CALENDAR);
    }
    if (products?.includes(ImportType.CONTACTS)) {
        scopes.push(...G_OAUTH_SCOPE_CONTACTS);
    }

    scopes.filter(isTruthy).flat(1);
    return scopes;
};

const getOutlookScopes = (products?: ImportType[]) => {
    const scopes = [...O_OAUTH_SCOPE_DEFAULT];

    if (products?.includes(ImportType.MAIL)) {
        scopes.push(...O_OAUTH_SCOPE_MAIL);
    }
    if (products?.includes(ImportType.CALENDAR)) {
        scopes.push(...O_OAUTH_SCOPE_CALENDAR);
    }
    if (products?.includes(ImportType.CONTACTS)) {
        scopes.push(...O_OAUTH_SCOPE_CONTACTS);
    }

    scopes.filter(isTruthy).flat(1);
    return scopes;
};

export const getScopeFromProvider = (provider: ImportProvider, products: ImportType[], useGmailNewScope?: boolean) => {
    if (provider === ImportProvider.GOOGLE) {
        return getGoogleScopes(products, useGmailNewScope);
    }

    if (provider === ImportProvider.OUTLOOK) {
        return getOutlookScopes(products);
    }

    return [];
};
