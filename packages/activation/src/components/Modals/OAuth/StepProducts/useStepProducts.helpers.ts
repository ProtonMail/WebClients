import {
    G_OAUTH_SCOPE_CALENDAR,
    G_OAUTH_SCOPE_CONTACTS,
    G_OAUTH_SCOPE_DEFAULT,
    G_OAUTH_SCOPE_MAIL_READONLY,
    O_OAUTH_SCOPE_CALENDAR,
    O_OAUTH_SCOPE_CONTACTS,
    O_OAUTH_SCOPE_DEFAULT,
    O_OAUTH_SCOPE_MAIL,
} from '@proton/activation/src/constants';
import { ImportProvider, ImportType } from '@proton/activation/src/interface';
import isTruthy from '@proton/utils/isTruthy';

const getGoogleScopes = (products?: ImportType[]) => {
    const scopes = [...G_OAUTH_SCOPE_DEFAULT];

    if (products?.includes(ImportType.MAIL)) {
        scopes.push(...G_OAUTH_SCOPE_MAIL_READONLY);
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

export const getScopeFromProvider = (provider: ImportProvider, products: ImportType[]) => {
    if (provider === ImportProvider.GOOGLE) {
        return getGoogleScopes(products);
    }

    if (provider === ImportProvider.OUTLOOK) {
        return getOutlookScopes(products);
    }

    return [];
};
