import { getScopeFromProvider } from '@proton/activation/src/components/Modals/OAuth/OAuthModal.helpers';
import {
    O_OAUTH_SCOPE_CALENDAR,
    O_OAUTH_SCOPE_CONTACTS,
    O_OAUTH_SCOPE_DEFAULT,
    O_OAUTH_SCOPE_MAIL,
} from '@proton/activation/src/constants';
import { ImportProvider, ImportType } from '@proton/activation/src/interface';

describe('OAuthModal helpers', () => {
    describe('getScopeFromProvider', () => {
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
    });
});
