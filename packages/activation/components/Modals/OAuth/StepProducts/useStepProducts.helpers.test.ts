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

import { getScopeFromProvider } from './useStepProducts.helpers';

describe('useStepProducts tests', () => {
    it('Should return empty array', () => {
        const scope = getScopeFromProvider(ImportProvider.DEFAULT, [
            ImportType.CALENDAR,
            ImportType.CONTACTS,
            ImportType.MAIL,
        ]);
        expect(scope).toStrictEqual([]);
    });

    it('Should test all possible outlook scopes', () => {
        const scopeEmail = getScopeFromProvider(ImportProvider.OUTLOOK, [ImportType.MAIL]);
        expect(scopeEmail).toStrictEqual([...O_OAUTH_SCOPE_DEFAULT, ...O_OAUTH_SCOPE_MAIL]);

        const scopeContact = getScopeFromProvider(ImportProvider.OUTLOOK, [ImportType.CONTACTS]);
        expect(scopeContact).toStrictEqual([...O_OAUTH_SCOPE_DEFAULT, ...O_OAUTH_SCOPE_CONTACTS]);

        const scopeCalendar = getScopeFromProvider(ImportProvider.OUTLOOK, [ImportType.CALENDAR]);
        expect(scopeCalendar).toStrictEqual([...O_OAUTH_SCOPE_DEFAULT, ...O_OAUTH_SCOPE_CALENDAR]);
    });

    it('Should test all possible gmail scopes', () => {
        const scopeEmail = getScopeFromProvider(ImportProvider.GOOGLE, [ImportType.MAIL]);
        expect(scopeEmail).toStrictEqual([...G_OAUTH_SCOPE_DEFAULT, ...G_OAUTH_SCOPE_MAIL]);

        const scopeNewEmail = getScopeFromProvider(ImportProvider.GOOGLE, [ImportType.MAIL], true);
        expect(scopeNewEmail).toStrictEqual([...G_OAUTH_SCOPE_DEFAULT, ...G_OAUTH_SCOPE_MAIL_NEW_SCOPE]);

        const scopeContact = getScopeFromProvider(ImportProvider.GOOGLE, [ImportType.CONTACTS]);
        expect(scopeContact).toStrictEqual([...G_OAUTH_SCOPE_DEFAULT, ...G_OAUTH_SCOPE_CONTACTS]);

        const scopeCalendar = getScopeFromProvider(ImportProvider.GOOGLE, [ImportType.CALENDAR]);
        expect(scopeCalendar).toStrictEqual([...G_OAUTH_SCOPE_DEFAULT, ...G_OAUTH_SCOPE_CALENDAR]);
    });
});
