import { ItemState } from '@proton/pass/types';
import { parseUrl } from '@proton/pass/utils/url';

import type { State } from '../types';
import { selectAutofillCandidates, selectItemsByDomain } from './items';

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
                    data: {
                        type: 'login',
                        content: { urls: ['https://proton.me', 'https://subdomain.proton.me'] },
                    },
                },
                item2: {
                    /* item with unsecure protocol */
                    itemId: 'share1-item2',
                    state: ItemState.Active,
                    shareId: 'share1',
                    data: {
                        type: 'login',
                        content: { urls: ['http://proton.me'] },
                    },
                },
                item3: {
                    /* item with private domain */
                    itemId: 'share1-item3',
                    state: ItemState.Active,
                    shareId: 'share1',
                    data: {
                        type: 'login',
                        content: { urls: ['https://github.io'] },
                    },
                },
                item4: {
                    /* item with private sub-domain */
                    itemId: 'share1-item4',
                    state: ItemState.Active,
                    shareId: 'share1',
                    data: {
                        type: 'login',
                        content: { urls: ['https://private.subdomain.github.io'] },
                    },
                },
                item5: {
                    /* item with another private sub-domain */
                    itemId: 'share1-item5',
                    state: ItemState.Active,
                    shareId: 'share1',
                    data: {
                        type: 'login',
                        content: { urls: ['https://othersubdomain.github.io'] },
                    },
                },
            },
            share2: {
                item1: {
                    /* trashed item with secure protocol */
                    itemId: 'share2-item1',
                    state: ItemState.Trashed,
                    shareId: 'share2',
                    data: {
                        type: 'login',
                        content: { urls: ['https://proton.me'] },
                    },
                },
                item2: {
                    /* active item with unsecure protocol */
                    itemId: 'share2-item2',
                    state: ItemState.Active,
                    shareId: 'share2',
                    data: {
                        type: 'login',
                        content: { urls: ['http://proton.me'] },
                    },
                },
            },
            share3: {
                item1: {
                    /* non http protocols & invalid urls */
                    itemId: 'share3-item1',
                    state: ItemState.Active,
                    shareId: 'share3',
                    data: {
                        type: 'login',
                        content: { urls: ['ftp://proton.me', 'htp::://invalid'] },
                    },
                },
                item2: {
                    /* type note */
                    itemId: 'share3-item2',
                    state: ItemState.Active,
                    shareId: 'share3',
                    data: {
                        type: 'note',
                    },
                },
                item3: {
                    /* type alias */
                    itemId: 'share3-item3',
                    state: ItemState.Active,
                    shareId: 'share3',
                    data: {
                        type: 'alias',
                    },
                },
                item4: {
                    /* active item with nested subdomain */
                    itemId: 'share3-item4',
                    state: ItemState.Active,
                    shareId: 'share3',
                    data: {
                        type: 'login',
                        content: { urls: ['https://sub.domain.google.com'] },
                    },
                },
                item5: {
                    /* active item with nested subdomain */
                    itemId: 'share3-item5',
                    state: ItemState.Active,
                    shareId: 'share3',
                    data: {
                        type: 'login',
                        content: { urls: ['https://my.sub.domain.google.com'] },
                    },
                },
                item6: {
                    /* active item with unsecure nested subdomain */
                    state: ItemState.Active,
                    itemId: 'share3-item6',
                    shareId: 'share3',
                    data: {
                        type: 'login',
                        content: { urls: ['http://google.com'] },
                    },
                },
            },
            share4: {
                /* empty share */
            },
            optimistic: { history: [], checkpoint: undefined },
        },
    },
} as unknown as State;

describe('item selectors', () => {
    describe('selectItemsByURL', () => {
        test('should return nothing if url is not valid or no match', () => {
            expect(
                selectItemsByDomain(null, {
                    protocolFilter: [],
                    isPrivate: false,
                })(stateMock)
            ).toEqual([]);

            expect(
                selectItemsByDomain('', {
                    protocolFilter: [],
                    isPrivate: false,
                })(stateMock)
            ).toEqual([]);

            expect(
                selectItemsByDomain('http::://invalid.com', {
                    protocolFilter: [],
                    isPrivate: false,
                })(stateMock)
            ).toEqual([]);
        });

        test('should return nothing if no items match url', () => {
            expect(
                selectItemsByDomain('proton.ch', {
                    protocolFilter: [],
                    isPrivate: false,
                })(stateMock)
            ).toEqual([]);

            expect(
                selectItemsByDomain('unknown.proton.me', {
                    protocolFilter: [],
                    isPrivate: false,
                })(stateMock)
            ).toEqual([]);

            expect(
                selectItemsByDomain('proton.me/secret/path', {
                    protocolFilter: [],
                    isPrivate: false,
                })(stateMock)
            ).toEqual([]);
        });

        test('should return only active items on direct match', () => {
            const items = selectItemsByDomain('proton.me', {
                protocolFilter: [],
                isPrivate: false,
            })(stateMock);

            expect(items.length).toEqual(4);
            expect(items[0]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item1));
            expect(items[1]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item2));
            expect(items[2]).toEqual(withOptimistics(stateMock.items.byShareId.share2.item2));
            expect(items[3]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item1));
        });

        test('should return only active items on direct match', () => {
            const items = selectItemsByDomain('proton.me', {
                protocolFilter: [],
                isPrivate: false,
            })(stateMock);

            expect(items.length).toEqual(4);
            expect(items[0]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item1));
            expect(items[1]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item2));
            expect(items[2]).toEqual(withOptimistics(stateMock.items.byShareId.share2.item2));
            expect(items[3]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item1));
        });

        test('should return only share matches if shareId filter', () => {
            const itemsShare1 = selectItemsByDomain('proton.me', {
                protocolFilter: [],
                isPrivate: false,
                shareId: 'share1',
            })(stateMock);

            expect(itemsShare1.length).toEqual(2);
            expect(itemsShare1[0]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item1));
            expect(itemsShare1[1]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item2));

            const itemsShare2 = selectItemsByDomain('proton.me', {
                protocolFilter: [],
                isPrivate: false,
                shareId: 'share2',
            })(stateMock);

            expect(itemsShare2.length).toEqual(1);
            expect(itemsShare2[0]).toEqual(withOptimistics(stateMock.items.byShareId.share2.item2));

            const itemsShare3 = selectItemsByDomain('proton.me', {
                protocolFilter: [],
                isPrivate: false,
                shareId: 'share3',
            })(stateMock);

            expect(itemsShare3.length).toEqual(1);
            expect(itemsShare3[0]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item1));

            const itemsShare4 = selectItemsByDomain('proton.me', {
                protocolFilter: [],
                isPrivate: false,
                shareId: 'share4',
            })(stateMock);

            expect(itemsShare4.length).toEqual(0);
        });

        test('should use protocol filter if any', () => {
            const itemsHTTPS = selectItemsByDomain('proton.me', {
                protocolFilter: ['https:'],
                isPrivate: false,
            })(stateMock);

            expect(itemsHTTPS.length).toEqual(1);
            expect(itemsHTTPS[0]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item1));

            const itemsHTTP = selectItemsByDomain('proton.me', {
                protocolFilter: ['http:'],
                isPrivate: false,
            })(stateMock);

            expect(itemsHTTP.length).toEqual(2);
            expect(itemsHTTP[0]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item2));
            expect(itemsHTTP[1]).toEqual(withOptimistics(stateMock.items.byShareId.share2.item2));

            const itemsAny = selectItemsByDomain('proton.me', {
                protocolFilter: [],
                isPrivate: false,
            })(stateMock);

            expect(itemsAny.length).toEqual(4);
            expect(itemsAny[0]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item1));
            expect(itemsAny[1]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item2));
            expect(itemsAny[2]).toEqual(withOptimistics(stateMock.items.byShareId.share2.item2));
            expect(itemsAny[3]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item1));

            const itemsFTP = selectItemsByDomain('proton.me', {
                protocolFilter: ['ftp:'],
                isPrivate: false,
            })(stateMock);

            expect(itemsFTP.length).toEqual(1);
            expect(itemsFTP[0]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item1));
        });
    });

    describe('selectAutofillCandidates', () => {
        test('should return nothing if invalid url', () => {
            expect(selectAutofillCandidates(parseUrl(''))(stateMock)).toEqual([]);
            expect(selectAutofillCandidates({ ...parseUrl('https://a.b.c'), protocol: null })(stateMock)).toEqual([]);
        });

        test('should not pass a protocol filter if url is secure', () => {
            const candidates = selectAutofillCandidates(parseUrl('https://google.com'))(stateMock);
            expect(candidates.length).toEqual(3);
            expect(candidates[0]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item6));
            expect(candidates[1]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item4));
            expect(candidates[2]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item5));
        });

        test('should pass a protocol filter if url is not secure `https:`', () => {
            const candidates = selectAutofillCandidates(parseUrl('http://google.com'))(stateMock);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item6));
        });

        test('should pass a protocol filter if url is not secure `https:`', () => {
            const candidates = selectAutofillCandidates(parseUrl('http://google.com'))(stateMock);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item6));
        });

        test('should return only matching protocols', () => {
            const candidates = selectAutofillCandidates(parseUrl('ftp://proton.me'))(stateMock);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item1));
        });

        test('if no direct public subdomain match, should sort top-level domains and other subdomain matches', () => {
            const candidates = selectAutofillCandidates(parseUrl('https://account.google.com'))(stateMock);
            expect(candidates.length).toEqual(3);
            expect(candidates[0]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item6));
            expect(candidates[1]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item4));
            expect(candidates[2]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item5));
        });

        test('if public subdomain match, should push subdomain matches on top, then top-level domain, then other subdomains', () => {
            const candidates = selectAutofillCandidates(parseUrl('https://my.sub.domain.google.com'))(stateMock);
            expect(candidates.length).toEqual(3);
            expect(candidates[0]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item5));
            expect(candidates[1]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item6));
            expect(candidates[2]).toEqual(withOptimistics(stateMock.items.byShareId.share3.item4));
        });

        test('if private top level domain, should match only top level domain', () => {
            const candidates = selectAutofillCandidates(parseUrl('https://github.io'))(stateMock);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item3));
        });

        test('if private sub domain, should match only specific subdomain', () => {
            const candidates = selectAutofillCandidates(parseUrl('https://subdomain.github.io'))(stateMock);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(withOptimistics(stateMock.items.byShareId.share1.item4));
        });
    });
});
