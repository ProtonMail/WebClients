import { CheckedProductMap, ImportType, OAUTH_PROVIDER } from '@proton/shared/lib/interfaces/EasySwitch';
import isTruthy from '@proton/utils/isTruthy';

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
} from './constants';

const { MAIL, CALENDAR, CONTACTS } = ImportType;

export const getScopeFromProvider = (
    provider: OAUTH_PROVIDER,
    checkedTypes: CheckedProductMap,
    useGmailNewScope?: boolean
) => {
    if (provider === OAUTH_PROVIDER.GOOGLE) {
        const scopes = [
            ...G_OAUTH_SCOPE_DEFAULT,
            checkedTypes[MAIL] && (useGmailNewScope ? G_OAUTH_SCOPE_MAIL_NEW_SCOPE : G_OAUTH_SCOPE_MAIL),
            checkedTypes[CALENDAR] && G_OAUTH_SCOPE_CALENDAR,
            checkedTypes[CONTACTS] && G_OAUTH_SCOPE_CONTACTS,
            // checkedTypes[DRIVE] && G_OAUTH_SCOPE_DRIVE,
        ]
            .filter(isTruthy)
            .flat(1);

        return scopes;
    }

    if (provider === OAUTH_PROVIDER.OUTLOOK) {
        const scopes = [
            ...O_OAUTH_SCOPE_DEFAULT,
            checkedTypes[MAIL] && O_OAUTH_SCOPE_MAIL,
            checkedTypes[CALENDAR] && O_OAUTH_SCOPE_CALENDAR,
            checkedTypes[CONTACTS] && O_OAUTH_SCOPE_CONTACTS,
            // checkedTypes[DRIVE] && O_OAUTH_SCOPE_DRIVE,
        ]
            .filter(isTruthy)
            .flat(1);

        return scopes;
    }

    return [];
};
