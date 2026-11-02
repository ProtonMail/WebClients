import type { ShareMeta } from '@proton/shared/lib/interfaces/drive/share';

import { shareMetaToShareWithKey } from './transformers';

const share: ShareMeta = {
    AddressID: 'address-1',
    ShareID: 'share-1',
    Type: 2,
    LinkID: 'link-1',
    Locked: false,
    VolumeID: 'volume-1',
    Creator: 'creator@example.com',
    State: 1,
    CreateTime: 0,
    LinkType: 1,
    Key: 'key',
    Passphrase: 'passphrase',
    PassphraseSignature: 'signature',
    Memberships: [],
};

describe('shareMetaToShareWithKey', () => {
    it('uses the share AddressID when present', () => {
        expect(shareMetaToShareWithKey(share).addressId).toBe('address-1');
    });

    it('does not throw when the share has no AddressID and no membership', () => {
        const result = shareMetaToShareWithKey({ ...share, AddressID: '' });

        expect(result.addressId).toBeUndefined();
        expect(result.memberships).toEqual([]);
    });
});
