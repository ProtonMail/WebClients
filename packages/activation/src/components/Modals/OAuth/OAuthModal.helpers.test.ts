import {
    O_OAUTH_SCOPE_CALENDAR,
    O_OAUTH_SCOPE_CONTACTS,
    O_OAUTH_SCOPE_DEFAULT,
    O_OAUTH_SCOPE_MAIL,
} from '../../../constants';
import { ImportProvider, ImportType } from '../../../interface';
import { getScopeFromProvider } from './OAuthModal.helpers';

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
