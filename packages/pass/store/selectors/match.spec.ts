import { getStateMock } from '@proton/pass/store/selectors/mock';

import { createMatchDomainItemsSelector } from './match';

const filter = { protocol: null, port: null, isPrivate: false };
const state = getStateMock();

describe('Match selectors', () => {
    describe('selectItemsByURL', () => {
        test('should return nothing if url is not valid or no match', () => {
            expect(createMatchDomainItemsSelector(null, filter)(state)).toEqual([]);
            expect(createMatchDomainItemsSelector('', filter)(state)).toEqual([]);
            expect(createMatchDomainItemsSelector('http::://invalid.com', filter)(state)).toEqual([]);
        });

        test('should return nothing if no items match url', () => {
            expect(createMatchDomainItemsSelector('proton.ch', filter)(state)).toEqual([]);
            expect(createMatchDomainItemsSelector('unknown.proton.me', filter)(state)).toEqual([]);
            expect(createMatchDomainItemsSelector('proton.me/secret/path', filter)(state)).toEqual([]);
        });

        test('should return only active items on direct match', () => {
            const items = createMatchDomainItemsSelector('proton.me', filter)(state);

            expect(items.length).toEqual(4);
            expect(items[0]).toEqual(state.items.byShareId.share1.item1);
            expect(items[1]).toEqual(state.items.byShareId.share1.item2);
            expect(items[2]).toEqual(state.items.byShareId.share2.item2);
            expect(items[3]).toEqual(state.items.byShareId.share3.item1);
        });

        test('should return only active items on direct match', () => {
            const items = createMatchDomainItemsSelector('proton.me', filter)(state);

            expect(items.length).toEqual(4);
            expect(items[0]).toEqual(state.items.byShareId.share1.item1);
            expect(items[1]).toEqual(state.items.byShareId.share1.item2);
            expect(items[2]).toEqual(state.items.byShareId.share2.item2);
            expect(items[3]).toEqual(state.items.byShareId.share3.item1);
        });

        test('should return only share matches if shareId filter', () => {
            const itemsShare1 = createMatchDomainItemsSelector('proton.me', { ...filter, shareIds: ['share1'] })(state);
            expect(itemsShare1.length).toEqual(2);
            expect(itemsShare1[0]).toEqual(state.items.byShareId.share1.item1);
            expect(itemsShare1[1]).toEqual(state.items.byShareId.share1.item2);

            const itemsShare2 = createMatchDomainItemsSelector('proton.me', { ...filter, shareIds: ['share2'] })(state);
            expect(itemsShare2.length).toEqual(1);
            expect(itemsShare2[0]).toEqual(state.items.byShareId.share2.item2);

            const itemsShare3 = createMatchDomainItemsSelector('proton.me', { ...filter, shareIds: ['share3'] })(state);
            expect(itemsShare3.length).toEqual(1);
            expect(itemsShare3[0]).toEqual(state.items.byShareId.share3.item1);

            const itemsShare4 = createMatchDomainItemsSelector('proton.me', { ...filter, shareIds: ['share4'] })(state);
            expect(itemsShare4.length).toEqual(0);
        });

        test('should use protocol filter if any', () => {
            const itemsHTTPS = createMatchDomainItemsSelector('proton.me', { ...filter, protocol: 'https:' })(state);
            expect(itemsHTTPS.length).toEqual(1);
            expect(itemsHTTPS[0]).toEqual(state.items.byShareId.share1.item1);

            const itemsHTTP = createMatchDomainItemsSelector('proton.me', { ...filter, protocol: 'http:' })(state);
            expect(itemsHTTP.length).toEqual(2);
            expect(itemsHTTP[0]).toEqual(state.items.byShareId.share1.item2);
            expect(itemsHTTP[1]).toEqual(state.items.byShareId.share2.item2);

            const itemsAny = createMatchDomainItemsSelector('proton.me', filter)(state);
            expect(itemsAny.length).toEqual(4);
            expect(itemsAny[0]).toEqual(state.items.byShareId.share1.item1);
            expect(itemsAny[1]).toEqual(state.items.byShareId.share1.item2);
            expect(itemsAny[2]).toEqual(state.items.byShareId.share2.item2);
            expect(itemsAny[3]).toEqual(state.items.byShareId.share3.item1);

            const itemsFTP = createMatchDomainItemsSelector('proton.me', { ...filter, protocol: 'ftp:' })(state);
            expect(itemsFTP.length).toEqual(1);
            expect(itemsFTP[0]).toEqual(state.items.byShareId.share3.item1);
        });
    });
});
