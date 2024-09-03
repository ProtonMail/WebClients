import { getSanitizedUserIdentifiers } from './item.utils';

describe('Item utils', () => {
    describe('getSanitizedUserIdentifiers', () => {
        test.each([
            [
                'valid email & empty username',
                { itemEmail: 'test@proton.me', itemUsername: '' },
                { email: 'test@proton.me', username: '' },
            ],
            [
                'valid email & invalid username email',
                { itemEmail: 'test@proton.me', itemUsername: 'username' },
                { email: 'test@proton.me', username: 'username' },
            ],
            [
                'valid email & valid username email',
                { itemEmail: 'test@proton.me', itemUsername: 'test@proton.me' },
                { email: 'test@proton.me', username: 'test@proton.me' },
            ],
            [
                'invalid email & empty username',
                { itemEmail: 'invalid-email', itemUsername: '' },
                { email: '', username: 'invalid-email' },
            ],
            [
                'invalid email & valid username email',
                { itemEmail: 'invalid-email', itemUsername: 'test@proton.me' },
                { email: 'test@proton.me', username: 'invalid-email' },
            ],
            [
                'empty email & valid username email',
                { itemEmail: '', itemUsername: 'valid@example.com' },
                { email: 'valid@example.com', username: '' },
            ],
            [
                'empty email & invalid username email',
                { itemEmail: '', itemUsername: 'invalid-email' },
                { email: '', username: 'invalid-email' },
            ],
            [
                'empty email & valid username email',
                { itemEmail: '', itemUsername: 'valid@proton.me' },
                { email: 'valid@proton.me', username: '' },
            ],
            ['empty email, empty username', { itemEmail: '', itemUsername: '' }, { email: '', username: '' }],
        ])('should handle %s correctly', (_, input, expected) => {
            const result = getSanitizedUserIdentifiers(input);
            expect(result).toEqual(expected);
        });
    });
});
