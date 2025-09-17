import {
    itemDelete,
    itemsDeleteEvent,
    secureLinkCreate,
    secureLinkRemove,
    secureLinksGet,
    shareEventDelete,
} from '@proton/pass/store/actions';
import type { SecureLink } from '@proton/pass/types';

import type { SecureLinkState } from './secure-links';
import { removeSecureLinksForItems, removeSecureLinksForShare, secureLinksReducer } from './secure-links';

const state = {
    ['share1']: {
        ['item1']: [{ linkId: 'link-1' }, { linkId: 'link-1b' }],
        ['item2']: [{ linkId: 'link-2' }],
        ['item3']: [{ linkId: 'link-3' }],
    },
    ['share2']: {
        ['item1']: [{ linkId: 'link-4' }],
    },
} as unknown as SecureLinkState;

describe('`removeSecureLinksForItems`', () => {
    test('should remove specified items and preserve others', () => {
        const singleItem = removeSecureLinksForItems(state, 'share1', ['item1']);
        expect(singleItem.share1.item1).toBeUndefined();
        expect(singleItem.share1.item2).toBeDefined();
        expect(singleItem.share2).toEqual(state.share2);

        const multipleItems = removeSecureLinksForItems(state, 'share1', ['item1', 'item2']);
        expect(multipleItems.share1).toEqual({ item3: state.share1.item3 });
        expect(multipleItems.share2).toEqual(state.share2);
    });

    test('should handle edge cases gracefully', () => {
        expect(removeSecureLinksForItems(state, 'nonExistentShare', ['item1'])).toEqual(state);
        expect(removeSecureLinksForItems(state, 'share1', ['nonExistentItem'])).toEqual(state);
        expect(removeSecureLinksForItems(state, 'share1', [])).toEqual(state);
    });
});

describe('`removeSecureLinksForShare`', () => {
    test('should remove specified share and preserve others', () => {
        const result = removeSecureLinksForShare(state, 'share1');
        expect(result.share1).toBeUndefined();
        expect(result.share2).toEqual(state.share2);
    });

    test('should handle edge cases gracefully', () => {
        expect(removeSecureLinksForShare(state, 'nonExistentShare')).toEqual(state);
        expect(removeSecureLinksForShare({}, 'share1')).toEqual({});
    });
});

describe('secure-links reducer', () => {
    test('should populate state from `secureLinksGet` success', () => {
        const links = [
            { shareId: 'share1', itemId: 'item1', linkId: 'link-1' },
            { shareId: 'share1', itemId: 'item2', linkId: 'link-2' },
            { shareId: 'share2', itemId: 'item1', linkId: 'link-3' },
        ] as SecureLink[];

        const action = secureLinksGet.success('requestId', links);
        const result = secureLinksReducer({}, action);

        expect(result.share1.item1).toEqual([links[0]]);
        expect(result.share1.item2).toEqual([links[1]]);
        expect(result.share2.item1).toEqual([links[2]]);
    });

    test('should add new secure link on `secureLinkCreate`', () => {
        const newLink = { shareId: 'share1', itemId: 'item1', linkId: 'link-new' } as SecureLink;
        const action = secureLinkCreate.success('requestId', newLink);
        const result = secureLinksReducer(state, action);

        expect(result.share1.item1).toHaveLength(3);
        expect(result.share1.item1).toContain(newLink);
        expect(result.share1.item2).toEqual(state.share1.item2);
    });

    test('should create new share/item when adding secure link to empty state', () => {
        const newLink = { shareId: 'newShare', itemId: 'newItem', linkId: 'link-new' } as SecureLink;
        const action = secureLinkCreate.success('requestId', newLink);
        const result = secureLinksReducer({}, action);

        expect(result.newShare.newItem).toEqual([newLink]);
    });

    test('should remove specific secure link and preserve others on `secureLinkRemove`', () => {
        const action = secureLinkRemove.success('requestId', {
            shareId: 'share1',
            itemId: 'item1',
            linkId: 'link-1',
        });
        const result = secureLinksReducer(state, action);

        expect(result.share1.item1).toHaveLength(1);
        expect(result.share1.item1[0].linkId).toBe('link-1b');
    });

    test('should remove item when removing last secure link on `secureLinkRemove`', () => {
        const action = secureLinkRemove.success('requestId', {
            shareId: 'share1',
            itemId: 'item2',
            linkId: 'link-2',
        });
        const result = secureLinksReducer(state, action);

        expect(result.share1.item2).toBeUndefined();
        expect(result.share1.item1).toBeDefined();
        expect(result.share1.item3).toBeDefined();
    });

    test('should remove links for single item delete', () => {
        const action = itemDelete.success('requestId', { shareId: 'share1', itemId: 'item1', hadFiles: false });
        const result = secureLinksReducer(state, action);

        expect(result.share1.item1).toBeUndefined();
        expect(result.share1.item2).toBeDefined();
        expect(result.share2).toEqual(state.share2);
    });

    test('should remove links for multiple items delete', () => {
        const action = itemsDeleteEvent('share1', ['item1', 'item2', 'item3']);
        const result = secureLinksReducer(state, action);

        expect(result.share1).toEqual({});
        expect(result.share2).toEqual(state.share2);
    });

    test('should remove entire share for share delete', () => {
        const action = shareEventDelete({ shareId: 'share1' } as any);
        const result = secureLinksReducer(state, action);

        expect(result.share1).toBeUndefined();
        expect(result.share2).toEqual(state.share2);
    });
});
