import { selectVisibleItems } from '../../../store/selectors';
import { getStateMock } from '../../../store/selectors/mock';
import type { ItemRevision } from '../../../types';
import { ItemState } from '../../../types';
import { AutofillMode } from '../../../types/protobuf';
import type { SearchItemsByDomainOptions } from '../types';
import { searchItemsByDomain } from './match';

const state = getStateMock();

describe('Match selectors', () => {
    const items = selectVisibleItems(state);

    const options: SearchItemsByDomainOptions = {
        privateDomains: new Set(),
        sortOn: 'priority',
        strict: false,
        shareIds: undefined,
        regexEnabled: true,
    };

    test('should return nothing if url is not valid or no match', () => {
        expect(searchItemsByDomain(undefined, items, options)).toEqual([]);
        expect(searchItemsByDomain('', items, options)).toEqual([]);
        expect(searchItemsByDomain('http::://invalid.com', items, options)).toEqual([]);
    });

    test('should return nothing if no items match url', () => {
        expect(searchItemsByDomain('proton.ch', items, options)).toEqual([]);
    });

    test('should return only active items on direct match', () => {
        const candidates = searchItemsByDomain('https://proton.me', items, options);
        expect(candidates.length).toEqual(4);
        expect(candidates[0]).toEqual(state.items.byShareId.share1.item1);
        expect(candidates[1]).toEqual(state.items.byShareId.share1.item2);
        expect(candidates[2]).toEqual(state.items.byShareId.share2.item2);
        expect(candidates[3]).toEqual(state.items.byShareId.share3.item1);
    });

    test('should return only active items on direct match', () => {
        const candidates = searchItemsByDomain('https://proton.me', items, options);
        expect(candidates.length).toEqual(4);
        expect(candidates[0]).toEqual(state.items.byShareId.share1.item1);
        expect(candidates[1]).toEqual(state.items.byShareId.share1.item2);
        expect(candidates[2]).toEqual(state.items.byShareId.share2.item2);
        expect(candidates[3]).toEqual(state.items.byShareId.share3.item1);
    });

    test('should return only share matches if shareId filter', () => {
        const itemsShare1 = searchItemsByDomain('https://proton.me', items, { ...options, shareIds: ['share1'] });
        expect(itemsShare1.length).toEqual(2);
        expect(itemsShare1[0]).toEqual(state.items.byShareId.share1.item1);
        expect(itemsShare1[1]).toEqual(state.items.byShareId.share1.item2);

        const itemsShare2 = searchItemsByDomain('https://proton.me', items, { ...options, shareIds: ['share2'] });
        expect(itemsShare2.length).toEqual(1);
        expect(itemsShare2[0]).toEqual(state.items.byShareId.share2.item2);

        const itemsShare3 = searchItemsByDomain('ftp://proton.me', items, { ...options, shareIds: ['share3'] });
        expect(itemsShare3.length).toEqual(1);
        expect(itemsShare3[0]).toEqual(state.items.byShareId.share3.item1);

        const itemsShare4 = searchItemsByDomain('http://proton.me', items, { ...options, shareIds: ['share4'] });
        expect(itemsShare4.length).toEqual(0);
    });

    test('should use protocol filter if any', () => {
        const itemsHTTPS = searchItemsByDomain('https://proton.me', items, options);
        expect(itemsHTTPS.length).toEqual(4);
        expect(itemsHTTPS[0]).toEqual(state.items.byShareId.share1.item1);
        expect(itemsHTTPS[1]).toEqual(state.items.byShareId.share1.item2);
        expect(itemsHTTPS[2]).toEqual(state.items.byShareId.share2.item2);
        expect(itemsHTTPS[3]).toEqual(state.items.byShareId.share3.item1);

        const itemsHTTP = searchItemsByDomain('http://proton.me', items, options);
        expect(itemsHTTP.length).toEqual(2);
        expect(itemsHTTP[0]).toEqual(state.items.byShareId.share1.item2);
        expect(itemsHTTP[1]).toEqual(state.items.byShareId.share2.item2);

        const itemsFTP = searchItemsByDomain('ftp://proton.me', items, options);
        expect(itemsFTP.length).toEqual(1);
        expect(itemsFTP[0]).toEqual(state.items.byShareId.share3.item1);
    });

    test('should return nothing if invalid url', () => {
        expect(searchItemsByDomain('', items, options)).toEqual([]);
        expect(searchItemsByDomain('https://a.b.c', items, options)).toEqual([]);
    });

    test('should not pass a protocol filter if url is secure', () => {
        const candidates = searchItemsByDomain('https://google.com', items, options);
        expect(candidates.length).toEqual(3);
        expect(candidates[0]).toEqual(state.items.byShareId.share3.item6);
        expect(candidates[1]).toEqual(state.items.byShareId.share3.item4);
        expect(candidates[2]).toEqual(state.items.byShareId.share3.item5);
    });

    test('should pass a protocol filter if url is not secure `https:`', () => {
        const candidates = searchItemsByDomain('http://google.com', items, options);
        expect(candidates.length).toEqual(0);
    });

    test('should return only matching protocols', () => {
        const candidates = searchItemsByDomain('ftp://proton.me', items, options);
        expect(candidates.length).toEqual(1);
        expect(candidates[0]).toEqual(state.items.byShareId.share3.item1);
    });

    test('if no direct public subdomain match, should sort top-level domains and other subdomain matches', () => {
        const candidates = searchItemsByDomain('https://account.google.com', items, options);
        expect(candidates.length).toEqual(3);
        expect(candidates[0]).toEqual(state.items.byShareId.share3.item6);
        expect(candidates[1]).toEqual(state.items.byShareId.share3.item4);
        expect(candidates[2]).toEqual(state.items.byShareId.share3.item5);
    });

    test('if public subdomain match, should push subdomain matches on top, then top-level domain, then other subdomains', () => {
        const candidates = searchItemsByDomain('https://my.sub.domain.google.com', items, options);
        expect(candidates.length).toEqual(3);
        expect(candidates[0]).toEqual(state.items.byShareId.share3.item5);
        expect(candidates[1]).toEqual(state.items.byShareId.share3.item4);
        expect(candidates[2]).toEqual(state.items.byShareId.share3.item6);
    });

    test('if private top level domain, should match only top level domain', () => {
        const candidates = searchItemsByDomain('https://github.io', items, options);
        expect(candidates.length).toEqual(1);
        expect(candidates[0]).toEqual(state.items.byShareId.share1.item3);
    });

    test('if private sub domain, should match only specific subdomain', () => {
        const candidates = searchItemsByDomain('https://subdomain.github.io', items, options);
        expect(candidates.length).toEqual(1);
        expect(candidates[0]).toEqual(state.items.byShareId.share1.item4);
    });

    test('should not suggest an item from a hidden share', () => {
        const candidates = searchItemsByDomain('https://domain-of-hidden-share.com', items, options);
        expect(candidates.length).toEqual(0);
    });

    describe('early fuzzy filter', () => {
        const createItem = (url: string, mode: AutofillMode): ItemRevision =>
            ({
                itemId: 'test-item',
                shareId: 'share',
                state: ItemState.Active,
                data: { type: 'login', content: { autofillUrls: [{ url, mode }] } },
            }) as ItemRevision;

        describe('Pattern mode bypasses domain substring check', () => {
            // '*.me' does not contain 'pm.me' as substring, only the pattern bypass lets it through
            const item = createItem('**.me', AutofillMode.Pattern);

            test('should return item when pattern matches', () => {
                expect(searchItemsByDomain('https://pm.me', [item], options)).toHaveLength(1);
            });

            test('should not return item when pattern does not match', () => {
                expect(searchItemsByDomain('https://proton.ch', [item], options)).toHaveLength(0);
            });
        });

        describe('RegularExpression mode bypasses domain substring check', () => {
            // 'subdomain\d*\.acme\.com' does not contain 'acme.com' (escaped dot), only the regex bypass lets it through
            const item = createItem('subdomain\\d*\\.acme\\.com', AutofillMode.RegularExpression);

            test('should return item when regex matches and regexEnabled is true', () => {
                expect(
                    searchItemsByDomain('https://subdomain42.acme.com', [item], { ...options, regexEnabled: true })
                ).toHaveLength(1);
            });

            test('should not return item when regexEnabled is false', () => {
                expect(
                    searchItemsByDomain('https://subdomain42.acme.com', [item], { ...options, regexEnabled: false })
                ).toHaveLength(0);
            });
        });
    });
});
