import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { State } from '@proton/pass/store/types';
import type { FormSubmission } from '@proton/pass/types';
import { ItemState } from '@proton/pass/types';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { parseUrl } from '@proton/pass/utils/url/parser';

import { selectAutofillLoginCandidates, selectItemsByDomain, selectOTPCandidate } from './items';

const withOptimistics = (item: {}) => ({ ...item, failed: expect.any(Boolean), optimistic: expect.any(Boolean) });

const stateMock = {
    items: {
        byShareId: {
            share1: {
                item1: {
                    /* item with secure protocol */
                    itemId: 'share1-item1',
                    state: ItemState.Active,
                    shareId: 'share1',
                    data: itemBuilder('login').set('content', (content) =>
                        content
                            .set('urls', ['https://proton.me', 'https://subdomain.proton.me'])
                            .set('itemEmail', 'test@proton.me')
                            .set('totpUri', '424242424242424242424242')
                    ).data,
                },
                item2: {
                    /* item with unsecure protocol */
                    itemId: 'share1-item2',
                    state: ItemState.Active,
                    shareId: 'share1',
                    data: itemBuilder('login').set('content', (content) => content.set('urls', ['http://proton.me']))
                        .data,
                },
                item3: {
                    /* item with private domain */
                    itemId: 'share1-item3',
                    state: ItemState.Active,
                    shareId: 'share1',
                    data: itemBuilder('login').set('content', (content) => content.set('urls', ['https://github.io']))
                        .data,
                },
                item4: {
                    /* item with private sub-domain */
                    itemId: 'share1-item4',
                    state: ItemState.Active,
                    shareId: 'share1',
                    data: itemBuilder('login')
                        .set('content', (content) =>
                            content
                                .set('urls', ['https://private.subdomain.github.io'])
                                .set('itemUsername', 'test@github.io')
                        )
                        .set('extraFields', [
                            {
                                type: 'totp',
                                data: { totpUri: '424242424242424242424242' },
                                fieldName: 'totp',
                            },
                        ]).data,
                },
                item5: {
                    /* item with another private sub-domain */
                    itemId: 'share1-item5',
                    state: ItemState.Active,
                    shareId: 'share1',
                    data: itemBuilder('login').set('content', (content) =>
                        content.set('urls', ['https://othersubdomain.github.io'])
                    ).data,
                },
            },
            share2: {
                item1: {
                    /* trashed item with secure protocol */
                    itemId: 'share2-item1',
                    state: ItemState.Trashed,
                    shareId: 'share2',
                    data: itemBuilder('login').set('content', (content) => content.set('urls', ['https://proton.me']))
                        .data,
                },
                item2: {
                    /* active item with unsecure protocol */
                    itemId: 'share2-item2',
                    state: ItemState.Active,
                    shareId: 'share2',
                    data: itemBuilder('login').set('content', (content) => content.set('urls', ['http://proton.me']))
                        .data,
                },
            },
            share3: {
                item1: {
                    /* non http protocols & invalid urls */
                    itemId: 'share3-item1',
                    state: ItemState.Active,
                    shareId: 'share3',
                    data: itemBuilder('login').set('content', (content) =>
                        content.set('urls', ['ftp://proton.me', 'htp::://invalid'])
                    ).data,
                },
                item2: {
                    /* type note */
                    itemId: 'share3-item2',
                    state: ItemState.Active,
                    shareId: 'share3',
                    data: itemBuilder('note').data,
                },
                item3: {
                    /* type alias */
                    itemId: 'share3-item3',
                    state: ItemState.Active,
                    shareId: 'share3',
                    data: itemBuilder('alias').data,
                },
                item4: {
                    /* active item with nested subdomain */
                    itemId: 'share3-item4',
                    state: ItemState.Active,
                    shareId: 'share3',
                    data: itemBuilder('login').set('content', (content) =>
                        content.set('urls', ['https://sub.domain.google.com'])
                    ).data,
                },
                item5: {
                    /* active item with nested subdomain */
                    itemId: 'share3-item5',
                    state: ItemState.Active,
                    shareId: 'share3',
                    data: itemBuilder('login').set('content', (content) =>
                        content.set('urls', ['https://my.sub.domain.google.com'])
                    ).data,
                },
                item6: {
                    /* active item with unsecure nested subdomain */
                    state: ItemState.Active,
                    itemId: 'share3-item6',
                    shareId: 'share3',
                    data: itemBuilder('login').set('content', (content) => content.set('urls', ['http://google.com']))
                        .data,
                },
            },
            share4: {
                /* empty share */
            },
            share5: {
                item1: {
                    /* subdomain `A` OTP */
                    itemId: 'share5-item2',
                    state: ItemState.Active,
                    shareId: 'share5',
                    lastUseTime: getEpoch() + 1_200,
                    data: itemBuilder('login').set('content', (content) =>
                        content
                            .set('itemUsername', 'username@subdomain.com')
                            .set('urls', ['https://a.subdomain.com'])
                            .set('totpUri', '1212121212121212121212121212')
                    ).data,
                },
                item2: {
                    /* subdomain `B` OTP */
                    itemId: 'share5-item3',
                    state: ItemState.Active,
                    shareId: 'share5',
                    lastUseTime: getEpoch() + 1_000,
                    data: itemBuilder('login').set('content', (content) =>
                        content
                            .set('itemUsername', 'username@subdomain.com')
                            .set('urls', ['https://b.subdomain.com'])
                            .set('totpUri', '1212121212121212121212121212')
                    ).data,
                },
                item3: {
                    /* subdomain `B` OTP - more recently used */
                    itemId: 'share5-item3',
                    state: ItemState.Active,
                    shareId: 'share5',
                    lastUseTime: getEpoch() + 2_000,
                    data: itemBuilder('login').set('content', (content) =>
                        content
                            .set('itemUsername', 'username@subdomain.com')
                            .set('urls', ['https://b.subdomain.com'])
                            .set('totpUri', '1212121212121212121212121212')
                    ).data,
                },
                item4: {
                    /* top-level domain OTP */
                    itemId: 'share5-item4',
                    state: ItemState.Active,
                    shareId: 'share5',
                    lastUseTime: getEpoch(),
                    data: itemBuilder('login').set('content', (content) =>
                        content
                            .set('itemUsername', 'username@subdomain.com')
                            .set('urls', ['https://subdomain.com'])
                            .set('totpUri', '1212121212121212121212121212')
                    ).data,
                },
                item5: {
                    /* top-level domain OTP more recently used */
                    itemId: 'share5-item5',
                    state: ItemState.Active,
                    shareId: 'share5',
                    lastUseTime: getEpoch() + 2_000,
                    data: itemBuilder('login').set('content', (content) =>
                        content
                            .set('itemUsername', 'username@subdomain.com')
                            .set('urls', ['https://subdomain.com'])
                            .set('totpUri', '1212121212121212121212121212')
                    ).data,
                },
                item6: {
                    /* top-level domain OTP */
                    itemId: 'share5-item6',
                    state: ItemState.Active,
                    shareId: 'share5',
                    lastUseTime: getEpoch(),
                    data: itemBuilder('login').set('content', (content) =>
                        content
                            .set('itemUsername', 'username@subdomain.com')
                            .set('urls', ['https://a.domain.com'])
                            .set('totpUri', '1212121212121212121212121212')
                    ).data,
                },
            },
            optimistic: { history: [], checkpoint: undefined },
        },
    },
} as unknown as State;

const filter = { protocol: null, port: null, isPrivate: false };

describe('item selectors', () => {
    describe('selectItemsByURL', () => {
        test('should return nothing if url is not valid or no match', () => {
            expect(selectItemsByDomain(null, filter)(stateMock)).toEqual([]);
            expect(selectItemsByDomain('', filter)(stateMock)).toEqual([]);
            expect(selectItemsByDomain('http::://invalid.com', filter)(stateMock)).toEqual([]);
        });

        test('should return nothing if no items match url', () => {
            expect(selectItemsByDomain('proton.ch', filter)(stateMock)).toEqual([]);
            expect(selectItemsByDomain('unknown.proton.me', filter)(stateMock)).toEqual([]);
            expect(selectItemsByDomain('proton.me/secret/path', filter)(stateMock)).toEqual([]);
        });

        test('should return only active items on direct match', () => {
            const items = selectItemsByDomain('proton.me', filter)(stateMock);

            expect(items.length).toEqual(4);
            expect(items[0]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item1));
            expect(items[1]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item2));
            expect(items[2]).toEqual(withOptimistics(stateMock.items.byShareId.share2.item2));
            expect(items[3]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item1));
        });

        test('should return only active items on direct match', () => {
            const items = selectItemsByDomain('proton.me', filter)(stateMock);

            expect(items.length).toEqual(4);
            expect(items[0]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item1));
            expect(items[1]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item2));
            expect(items[2]).toEqual(withOptimistics(stateMock.items.byShareId.share2.item2));
            expect(items[3]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item1));
        });

        test('should return only share matches if shareId filter', () => {
            const itemsShare1 = selectItemsByDomain('proton.me', { ...filter, shareIds: ['share1'] })(stateMock);
            expect(itemsShare1.length).toEqual(2);
            expect(itemsShare1[0]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item1));
            expect(itemsShare1[1]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item2));

            const itemsShare2 = selectItemsByDomain('proton.me', { ...filter, shareIds: ['share2'] })(stateMock);
            expect(itemsShare2.length).toEqual(1);
            expect(itemsShare2[0]).toEqual(withOptimistics(stateMock.items.byShareId.share2.item2));

            const itemsShare3 = selectItemsByDomain('proton.me', { ...filter, shareIds: ['share3'] })(stateMock);
            expect(itemsShare3.length).toEqual(1);
            expect(itemsShare3[0]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item1));

            const itemsShare4 = selectItemsByDomain('proton.me', { ...filter, shareIds: ['share4'] })(stateMock);
            expect(itemsShare4.length).toEqual(0);
        });

        test('should use protocol filter if any', () => {
            const itemsHTTPS = selectItemsByDomain('proton.me', { ...filter, protocol: 'https:' })(stateMock);
            expect(itemsHTTPS.length).toEqual(1);
            expect(itemsHTTPS[0]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item1));

            const itemsHTTP = selectItemsByDomain('proton.me', { ...filter, protocol: 'http:' })(stateMock);
            expect(itemsHTTP.length).toEqual(2);
            expect(itemsHTTP[0]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item2));
            expect(itemsHTTP[1]).toEqual(withOptimistics(stateMock.items.byShareId.share2.item2));

            const itemsAny = selectItemsByDomain('proton.me', filter)(stateMock);
            expect(itemsAny.length).toEqual(4);
            expect(itemsAny[0]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item1));
            expect(itemsAny[1]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item2));
            expect(itemsAny[2]).toEqual(withOptimistics(stateMock.items.byShareId.share2.item2));
            expect(itemsAny[3]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item1));

            const itemsFTP = selectItemsByDomain('proton.me', { ...filter, protocol: 'ftp:' })(stateMock);
            expect(itemsFTP.length).toEqual(1);
            expect(itemsFTP[0]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item1));
        });
    });

    describe('selectAutofillCandidates', () => {
        test('should return nothing if invalid url', () => {
            expect(selectAutofillLoginCandidates(parseUrl(''))(stateMock)).toEqual([]);
            expect(selectAutofillLoginCandidates({ ...parseUrl('https://a.b.c'), protocol: null })(stateMock)).toEqual(
                []
            );
        });

        test('should not pass a protocol filter if url is secure', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('https://google.com'))(stateMock);
            expect(candidates.length).toEqual(3);
            expect(candidates[0]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item6));
            expect(candidates[1]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item4));
            expect(candidates[2]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item5));
        });

        test('should pass a protocol filter if url is not secure `https:`', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('http://google.com'))(stateMock);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item6));
        });

        test('should pass a protocol filter if url is not secure `https:`', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('http://google.com'))(stateMock);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item6));
        });

        test('should return only matching protocols', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('ftp://proton.me'))(stateMock);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item1));
        });

        test('if no direct public subdomain match, should sort top-level domains and other subdomain matches', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('https://account.google.com'))(stateMock);
            expect(candidates.length).toEqual(3);
            expect(candidates[0]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item6));
            expect(candidates[1]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item4));
            expect(candidates[2]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item5));
        });

        test('if public subdomain match, should push subdomain matches on top, then top-level domain, then other subdomains', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('https://my.sub.domain.google.com'))(stateMock);
            expect(candidates.length).toEqual(3);
            expect(candidates[0]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item5));
            expect(candidates[1]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item6));
            expect(candidates[2]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item4));
        });

        test('if private top level domain, should match only top level domain', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('https://github.io'))(stateMock);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item3));
        });

        test('if private sub domain, should match only specific subdomain', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('https://subdomain.github.io'))(stateMock);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item4));
        });
    });

    describe('selectOTPCandidate', () => {
        test('should match item for domain and username', () => {
            const submission = { data: { userIdentifier: 'test@proton.me' } } as FormSubmission;
            const candidate = selectOTPCandidate({ ...parseUrl('https://proton.me'), submission })(stateMock);
            expect(candidate).toEqual(withOptimistics(stateMock.items.byShareId.share1.item1));
        });

        test('should match item for subdomain and username', () => {
            const submission = { data: { userIdentifier: 'test@proton.me' } } as FormSubmission;
            const candidate = selectOTPCandidate({ ...parseUrl('https://subdomain.proton.me'), submission })(stateMock);
            expect(candidate).toEqual(withOptimistics(stateMock.items.byShareId.share1.item1));
        });

        test('should match item for domain and username when matching extra totp field', () => {
            const submission = { data: { userIdentifier: 'test@github.io' } } as FormSubmission;
            const candidate = selectOTPCandidate({
                ...parseUrl('https://private.subdomain.github.io'),
                submission,
            })(stateMock);

            expect(candidate).toEqual(withOptimistics(stateMock.items.byShareId.share1.item4));
        });

        test('should match last used item for top-level domain if username not provided', () => {
            const candidate = selectOTPCandidate(parseUrl('https://subdomain.com'))(stateMock);
            expect(candidate).toEqual(withOptimistics(stateMock.items.byShareId.share5.item5));
        });

        test('should match last used item for subdomain if username not provided', () => {
            const candidate = selectOTPCandidate(parseUrl('https://b.subdomain.com'))(stateMock);
            expect(candidate).toEqual(withOptimistics(stateMock.items.byShareId.share5.item3));
        });

        test('should match item for username & top-level domain', () => {
            const submission = { data: { userIdentifier: 'username@subdomain.com' } } as FormSubmission;
            const candidate = selectOTPCandidate({ ...parseUrl('https://subdomain.com'), submission })(stateMock);
            expect(candidate).toEqual(withOptimistics(stateMock.items.byShareId.share5.item5));
        });

        test('should allow item for username & top-level domain on subdomain', () => {
            const submission = { data: { userIdentifier: 'username@subdomain.com' } } as FormSubmission;
            const candidate = selectOTPCandidate({ ...parseUrl('https://unknown.subdomain.com'), submission })(
                stateMock
            );
            expect(candidate).toEqual(withOptimistics(stateMock.items.byShareId.share5.item5));
        });

        test('should prioritise subdomain/username match', () => {
            const submission = { data: { userIdentifier: 'username@subdomain.com' } } as FormSubmission;
            const candidateA = selectOTPCandidate({ ...parseUrl('https://a.subdomain.com'), submission })(stateMock);
            const candidateB = selectOTPCandidate({ ...parseUrl('https://b.subdomain.com'), submission })(stateMock);
            expect(candidateA).toEqual(withOptimistics(stateMock.items.byShareId.share5.item1));
            expect(candidateB).toEqual(withOptimistics(stateMock.items.byShareId.share5.item3));
        });

        test('should not match subdomain item for top-level url', () => {
            const submission = { data: { userIdentifier: 'username@subdomain.com' } } as FormSubmission;

            const candidateA = selectOTPCandidate({ ...parseUrl('https://domain.com'), submission })(stateMock);
            expect(candidateA).toEqual(undefined);

            const candidateB = selectOTPCandidate(parseUrl('https://domain.com'))(stateMock);
            expect(candidateB).toEqual(undefined);
        });

        test('should not match subdomain item for sub-subdomain url', () => {
            const candidate = selectOTPCandidate(parseUrl('https://a.b.domain.com'))(stateMock);
            expect(candidate).toEqual(undefined);
        });
    });
});
