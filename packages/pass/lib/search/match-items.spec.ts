import type { ItemRevision } from '../../types';
import { AutofillMode, CardType } from '../../types/protobuf';
import { obfuscate } from '../../utils/obfuscate/xor';
import { searchItems } from './match-items';

const searchAndExpect = (items: ItemRevision[], expected: ItemRevision[]) => (search: string) => {
    const result = searchItems(items, search);
    try {
        expect(result).toEqual(expected);
    } catch {
        throw new Error(`Search mismatch failed, "${search}" should have matched ${JSON.stringify(expected, null, 2)}`);
    }
};

describe('searchItems', () => {
    const items = [
        {
            data: {
                type: 'login',

                metadata: {
                    name: 'Login item',
                    note: obfuscate('This is item 1'),
                    itemUuid: '1',
                },
                content: {
                    itemEmail: obfuscate('user1@example.com'),
                    itemUsername: obfuscate('user1'),
                    autofillUrls: [{ url: 'https://example.com', mode: AutofillMode.Default }],
                    password: obfuscate(''),
                    totpUri: obfuscate('otpauth://totp/label?secret=secret&issuer=issuer'),
                },
                extraFields: [
                    {
                        fieldName: 'hidden label',
                        type: 'hidden',
                        data: {
                            content: obfuscate('hidden value'),
                        },
                    },
                    {
                        fieldName: 'text label',
                        type: 'text',
                        data: {
                            content: obfuscate('text value'),
                        },
                    },
                    {
                        fieldName: 'totp label',
                        type: 'totp',
                        data: {
                            totpUri: obfuscate('otpauth://totp/label?secret=extrafieldsecret&issuer=issuer'),
                        },
                    },
                ],
            },
        },
        {
            data: {
                type: 'note',
                metadata: {
                    name: 'Item 3',
                    note: obfuscate('This is item 2'),
                    itemUuid: '2',
                },
                content: {},
                extraFields: [],
            },
        },
        {
            data: {
                type: 'creditCard',
                metadata: {
                    name: 'Credit card item',
                    note: obfuscate('This is item 3'),
                    itemUuid: '3',
                },
                content: {
                    cardholderName: 'John Doe',
                    number: obfuscate('1234567890'),
                    verificationNumber: obfuscate(''),
                    pin: obfuscate(''),
                    cardType: CardType.Unspecified,
                    expirationDate: '',
                },
                extraFields: [],
            },
        },
        {
            data: {
                type: 'alias',
                metadata: {
                    name: 'Alias item',
                    note: obfuscate('This is item 4'),
                    itemUuid: '4',
                },
                content: {},
                extraFields: [],
            },
        },
        {
            data: {
                type: 'identity',
                metadata: {
                    name: 'Identity item',
                    note: obfuscate('This is item 5'),
                    itemUuid: '4',
                },
                content: {
                    fullName: '::full-name::',
                    birthdate: '::birthdate::',
                    extraPersonalDetails: [
                        { fieldName: '::field::', type: 'text', data: { content: '::personal-detail-1::' } },
                        { fieldName: '::field::', type: 'hidden', data: { content: '::personal-detail-2::' } },
                    ],
                    streetAddress: '::street-address::',
                    city: '::city::',
                    workEmail: '::work-email::',
                    extraWorkDetails: [
                        { fieldName: '::field::', type: 'hidden', data: { content: '::work-detail-1::' } },
                        { fieldName: '::field::', type: 'text', data: { content: '::work-detail-2::' } },
                    ],
                    extraSections: [
                        {
                            sectionName: '::section-1::',
                            sectionFields: [
                                { fieldName: '::field::', type: 'text', data: { content: '::first-section-1::' } },
                                { fieldName: '::field::', type: 'hidden', data: { content: '::first-section-2::' } },
                            ],
                        },
                        {
                            sectionName: '::section-2::',
                            sectionFields: [
                                { fieldName: '::field::', type: 'hidden', data: { content: '::second-section-1::' } },
                                { fieldName: '::field::', type: 'text', data: { content: '::second-section-2::' } },
                            ],
                        },
                    ],
                },
                extraFields: [],
            },
        },
        {
            data: {
                type: 'custom',
                metadata: {
                    name: 'Custom item',
                    note: obfuscate('This is item 6'),
                    itemUuid: '5',
                },
                extraFields: [
                    {
                        fieldName: 'custom-hidden-name',
                        type: 'hidden',
                        data: { content: obfuscate('custom-hidden-content') },
                    },
                    {
                        fieldName: 'custom-text-name',
                        type: 'text',
                        data: { content: obfuscate('custom-text-content') },
                    },
                    {
                        fieldName: 'custom-totp-name',
                        type: 'totp',
                        data: { content: obfuscate('custom-totp-content') },
                    },
                    {
                        fieldName: 'custom-timestamp-name',
                        type: 'timestamp',
                        data: { content: obfuscate('custom-timestamp-content') },
                    },
                ],
                content: {
                    sections: [
                        {
                            sectionName: 'custom-section-name',
                            sectionFields: [
                                {
                                    fieldName: 'custom-section-hidden-name',
                                    type: 'hidden',
                                    data: { content: 'custom-section-hidden-content' },
                                },
                                {
                                    fieldName: 'custom-section-text-name',
                                    type: 'text',
                                    data: { content: 'custom-section-text-content' },
                                },
                                {
                                    fieldName: 'custom-section-totp-name',
                                    type: 'totp',
                                    data: { content: 'custom-section-totp-content' },
                                },
                                {
                                    fieldName: 'custom-section-timestamp-name',
                                    type: 'timestamp',
                                    data: { content: 'custom-section-timestamp-content' },
                                },
                            ],
                        },
                    ],
                },
            },
        },
        {
            data: {
                type: 'wifi',
                metadata: {
                    name: 'Wifi item',
                    note: obfuscate('This is item 7'),
                    itemUuid: '6',
                },
                extraFields: [
                    {
                        fieldName: 'wifi-text-name',
                        type: 'text',
                        data: { content: obfuscate('wifi-text-content') },
                    },
                ],
            },
        },
        {
            data: {
                type: 'sshKey',
                metadata: {
                    name: 'SSH key item',
                    note: obfuscate('This is item 8'),
                    itemUuid: '7',
                },
                content: {
                    sections: [
                        {
                            sectionName: 'ssh-section-name',
                            sectionFields: [
                                {
                                    fieldName: 'ssh-text-name',
                                    type: 'text',
                                    data: { content: 'ssh-text-content' },
                                },
                            ],
                        },
                    ],
                },
            },
        },
    ] as ItemRevision[];

    it.each([
        { key: 'no search', search: [''], expected: items },
        /* All 5 items match on their note ("This is item N") and keep their
         * incoming order since ranking is off by default (filter only) */
        { key: 'note', search: ['this is item'], expected: [items[0], items[1], items[2], items[3], items[4]] },
        {
            key: 'login item',
            search: ['Login item', 'user1@example.com', 'user1', 'example.com', 'text label', 'text value'],
            expected: [items[0]],
        },
        { key: 'card item', search: ['John Doe'], expected: [items[2]] },
        {
            key: 'identity item',
            search: [
                'full-name',
                'birthdate',
                'street-address',
                'city',
                'work-email',
                'detail-2',
                'first-section-1::',
                'second-section',
            ],
            expected: [items[4]],
        },
        {
            key: 'custom item',
            search: [
                'Custom item',
                'custom-hidden-name',
                'custom-text-name',
                'custom-text-content',
                'custom-totp-name',
                'custom-timestamp-name',
                'custom-section-name',
                'custom-section-hidden-name',
                'custom-section-text-name',
                'custom-section-text-content',
                'custom-section-totp-name',
                'custom-section-timestamp-name',
            ],
            expected: [items[5]],
        },
        {
            key: 'wifi item',
            search: ['Wifi item', 'wifi-text-name', 'wifi-text-content'],
            expected: [items[6]],
        },
        {
            key: 'ssh item',
            search: ['SSH key item', 'ssh-section-name', 'ssh-text-name', 'ssh-text-content'],
            expected: [items[7]],
        },
    ])('should return matching items based on $key', ({ search, expected }) => {
        search.forEach(searchAndExpect(items, expected));
    });

    it.each([
        { key: 'query', search: ['db'] },
        {
            key: 'otp fields',
            search: [
                'otpauth://totp/label?secret=secret&issuer=issuer',
                'otpauth://totp/label?secret=extrafieldsecret&issuer=issuer',
            ],
        },
        { key: 'extra idendity details hidden', search: ['::personal-detail-2::', '::work-detail-1::'] },
        {
            key: 'custom non text details',
            search: [
                'custom-hidden-content',
                'custom-totp-content',
                'custom-timestamp-content',
                'custom-section-hidden-content',
                'custom-section-totp-content',
                'custom-section-timestamp-content',
            ],
        },
    ])('should return empty array when no match $key', ({ search }) => {
        search.forEach(searchAndExpect(items, []));
    });
});

describe('searchItems ranking', () => {
    const login = (
        name: string,
        { email = '', username = '', note = '', urls = [] as string[], lastUseTime = 0 } = {}
    ) =>
        ({
            lastUseTime,
            modifyTime: 0,
            data: {
                type: 'login',
                metadata: { name, note: obfuscate(note), itemUuid: name },
                content: {
                    itemEmail: obfuscate(email),
                    itemUsername: obfuscate(username),
                    autofillUrls: urls.map((url) => ({ url, mode: AutofillMode.Default })),
                    password: obfuscate(''),
                    totpUri: obfuscate(''),
                },
                extraFields: [],
            },
        }) as unknown as ItemRevision;

    const names = (items: ItemRevision[]) => items.map((item) => item.data.metadata.name);

    test('ranks title matches above field matches (the "protonmail" scenario)', () => {
        const protonmail = login('Protonmail', { email: 'me@protonmail.com' });
        const spotify = login('Spotify', { email: 'user@protonmail.com' });
        const netflix = login('Netflix', { email: 'hi@protonmail.com' });

        /* feed them in the "wrong" order to prove ranking, not input order, decides.
         * `Protonmail` wins on its title; the two address matches tie and keep input order. */
        const result = searchItems([spotify, netflix, protonmail], 'protonmail', true);
        expect(names(result)).toEqual(['Protonmail', 'Spotify', 'Netflix']);
    });

    test('ranks exact title above prefix title above word-boundary title', () => {
        const exact = login('Bank');
        const prefix = login('Bank of America');
        const word = login('My Bank');
        const substring = login('Filbankt');

        const result = searchItems([substring, word, prefix, exact], 'bank', true);
        expect(names(result)).toEqual(['Bank', 'Bank of America', 'My Bank', 'Filbankt']);
    });

    test('breaks score ties using the incoming order', () => {
        const a = login('GitHub', { email: 'a@dev.com' });
        const b = login('GitLab', { email: 'b@dev.com' });

        expect(names(searchItems([a, b], 'git', true))).toEqual(['GitHub', 'GitLab']);
        expect(names(searchItems([b, a], 'git', true))).toEqual(['GitLab', 'GitHub']);
    });

    test('preserves incoming order for exact-title ties (active sort wins)', () => {
        const a = login('Protonmail', { email: 'a@protonmail.com' });
        const b = login('Protonmail', { email: 'b@protonmail.com' });

        /* both are exact title matches (same score), so nothing reorders them:
         * they keep the incoming order, which is the user's active sort */
        expect(searchItems([a, b], 'protonmail', true)).toEqual([a, b]);
        expect(searchItems([b, a], 'protonmail', true)).toEqual([b, a]);
    });

    test('ranks login/username matches above url matches', () => {
        const username = login('Account A', { username: 'proton-user' });
        const url = login('Account B', { urls: ['https://proton.me'] });

        expect(names(searchItems([url, username], 'proton', true))).toEqual(['Account A', 'Account B']);
    });

    test('scores a word-boundary occurrence even when an earlier occurrence is mid-word', () => {
        /* "art" appears mid-word first ("smart"/"cartographer") in both titles, but only
         * `wordBoundary` has a later occurrence at a word boundary, which must win */
        const substring = login('cartographer');
        const wordBoundary = login('smart art');

        expect(names(searchItems([substring, wordBoundary], 'art', true))).toEqual(['smart art', 'cartographer']);
    });

    test('ignores empty needles produced by repeated whitespace', () => {
        const item = login('Proton Mail');

        /* the double space used to yield a `''` needle that disqualified every item */
        expect(searchItems([item], 'proton  mail')).toEqual([item]);
    });

    test('a title match always outranks a field match, regardless of quality', () => {
        /* worst-quality title match (substring) still beats the best-quality
         * field match (exact email): TITLE is spaced beyond the quality range */
        const titleSubstring = login('Firstbank');
        const emailExact = login('Other', { email: 'bank' });

        expect(names(searchItems([emailExact, titleSubstring], 'bank', true))).toEqual(['Firstbank', 'Other']);
    });

    test('match quality can break ties across the non-title tiers', () => {
        /* below TITLE the tiers are close enough that a stronger quality match on
         * a lower-weight field overtakes a weaker match on a higher-weight one */

        // exact URL match (50*8) beats an email substring (100*1)
        const emailSubstring = login('Account A', { email: 'myproton@example.com' });
        const urlExact = login('Account B', { urls: ['proton'] });
        expect(names(searchItems([emailSubstring, urlExact], 'proton', true))).toEqual(['Account B', 'Account A']);

        // exact note (10*8) beats a URL substring (50*1)
        const urlSubstring = login('Account C', { urls: ['https://example.com/myhome'] });
        const noteExact = login('Account D', { note: 'home' });
        expect(names(searchItems([urlSubstring, noteExact], 'home', true))).toEqual(['Account D', 'Account C']);
    });

    test('preserves incoming order when ranking is disabled (filter only)', () => {
        /* the same fixtures the "protonmail" ranking test uses, but with
         * `rankByRelevance = false` the field-title match on `protonmail` must
         * NOT float it up - only non-matches are dropped and the incoming order
         * (already sorted by the active sort option) is preserved */
        const protonmail = login('Protonmail', { email: 'me@protonmail.com' });
        const spotify = login('Spotify', { email: 'user@protonmail.com' });
        const netflix = login('Netflix', { email: 'hi@protonmail.com' });
        const github = login('GitHub', { email: 'me@github.com' });

        expect(names(searchItems([spotify, netflix, protonmail, github], 'protonmail', false))).toEqual([
            'Spotify',
            'Netflix',
            'Protonmail',
        ]);
    });
});
