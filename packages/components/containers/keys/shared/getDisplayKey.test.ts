import type { Key, UserModel } from '@proton/shared/lib/interfaces';

import { getDisplayKey } from './getDisplayKey';

const getForwardingKeyCanDelete = ({
    AddressForwardingID,
    GroupMemberID,
    isPrivate = true,
    isSelf = true,
}: {
    AddressForwardingID?: string | null;
    GroupMemberID?: string | null;
    isPrivate?: boolean;
    isSelf?: boolean;
}) => {
    const Key = {
        ID: 'key-id',
        Primary: 0,
        Flags: 3,
        AddressForwardingID,
        GroupMemberID,
    } as unknown as Key;

    const result = getDisplayKey({
        type: 'address',
        user: { isPrivate, isSelf } as UserModel,
        address: undefined,
        isLoading: false,
        signedKeyListMap: {},
        existsPrimaryKeyV6: false,
        Key,
        algorithmInfos: [],
        fingerprint: 'fingerprint',
        version: 4,
        creationDate: new Date(0),
        isDecrypted: true,
        isWeak: false,
        isE2EEForwardingKey: true,
        invalidKeyError: undefined,
    } as any);

    return result.permissions.canDelete;
};

describe('getDisplayKey - forwarding key deletion', () => {
    it('allows deleting a forwarding key not linked to anything (null)', () => {
        expect(getForwardingKeyCanDelete({ AddressForwardingID: null, GroupMemberID: null })).toBe(true);
    });

    it('allows deleting a forwarding key not linked to anything (undefined)', () => {
        expect(getForwardingKeyCanDelete({})).toBe(true);
    });

    it('prevents deleting a key linked to an active group membership', () => {
        expect(getForwardingKeyCanDelete({ AddressForwardingID: null, GroupMemberID: 'member-id' })).toBe(false);
        expect(getForwardingKeyCanDelete({ GroupMemberID: 'member-id' })).toBe(false);
    });

    it('prevents deleting a key linked to an active address forwarding', () => {
        expect(getForwardingKeyCanDelete({ AddressForwardingID: 'forwarding-id', GroupMemberID: null })).toBe(false);
        expect(getForwardingKeyCanDelete({ AddressForwardingID: 'forwarding-id' })).toBe(false);
    });

    it('prevents deleting a key linked to both', () => {
        expect(
            getForwardingKeyCanDelete({ AddressForwardingID: 'forwarding-id', GroupMemberID: 'member-id' })
        ).toBe(false);
    });

    it('prevents a non-private user from deleting their own unlinked forwarding key', () => {
        expect(getForwardingKeyCanDelete({ isPrivate: false, isSelf: true })).toBe(false);
    });

    it('allows an admin to delete an unlinked forwarding key of another user', () => {
        expect(getForwardingKeyCanDelete({ isPrivate: false, isSelf: false })).toBe(true);
    });
});
