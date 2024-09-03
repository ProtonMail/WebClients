import { useSanitizeUserIdentifiers } from './useSanitizeUserIdentifiers';

describe('useSanitizeUserIdentifiers', () => {
    test.each([
        [
            'valid email & empty username',
            { itemEmail: 'test@proton.me', itemUsername: '' },
            { itemEmail: 'test@proton.me', itemUsername: '' },
        ],
        [
            'valid email & invalid username email',
            { itemEmail: 'test@proton.me', itemUsername: 'username' },
            { itemEmail: 'test@proton.me', itemUsername: 'username' },
        ],
        [
            'valid email & valid username email',
            { itemEmail: 'test@proton.me', itemUsername: 'test@proton.me' },
            { itemEmail: 'test@proton.me', itemUsername: 'test@proton.me' },
        ],
        [
            'invalid email & empty username',
            { itemEmail: 'invalid-email', itemUsername: '' },
            { itemEmail: '', itemUsername: 'invalid-email' },
        ],
        [
            'invalid email & valid username email',
            { itemEmail: 'invalid-email', itemUsername: 'test@proton.me' },
            { itemEmail: 'test@proton.me', itemUsername: 'invalid-email' },
        ],
        [
            'empty email & valid username email',
            { itemEmail: '', itemUsername: 'valid@example.com' },
            { itemEmail: 'valid@example.com', itemUsername: '' },
        ],
        [
            'empty email & invalid username email',
            { itemEmail: '', itemUsername: 'invalid-email' },
            { itemEmail: '', itemUsername: 'invalid-email' },
        ],
        [
            'empty email & valid username email',
            { itemEmail: '', itemUsername: 'valid@proton.me' },
            { itemEmail: 'valid@proton.me', itemUsername: '' },
        ],
        ['empty email, empty username', { itemEmail: '', itemUsername: '' }, { itemEmail: '', itemUsername: '' }],
        // Adding the missing test case
    ])('should handle %s correctly', (_, input, expected) => {
        const result = useSanitizeUserIdentifiers(input);
        expect(result).toEqual(expected);
    });
});
