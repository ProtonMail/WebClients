import cloneDeep from 'lodash/cloneDeep';

import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { SanitizedPasskey } from '@proton/pass/lib/passkeys/types';
import { type ShareItem, rootReducer } from '@proton/pass/store/reducers';
import type { State } from '@proton/pass/store/types';
import type { Item, ItemRevision } from '@proton/pass/types';
import { ContentFormatVersion, ItemState, ShareRole, ShareType } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

export const mockShareId = uniqueId();
export const mockItemId = uniqueId();

export const mockShare: ShareItem = {
    content: '',
    createTime: 0,
    eventId: uniqueId(),
    newUserInvitesReady: 0,
    owner: true,
    shared: false,
    shareId: mockShareId,
    shareRoleId: ShareRole.ADMIN,
    targetId: uniqueId(),
    targetMaxMembers: 1,
    targetMembers: 1,
    targetType: ShareType.Vault,
    vaultId: uniqueId(),
};

export const getMockItem = (data: Item = itemBuilder('login').data): ItemRevision => ({
    aliasEmail: null,
    contentFormatVersion: ContentFormatVersion.Item,
    createTime: 0,
    data,
    itemId: uniqueId(),
    lastUseTime: 0,
    modifyTime: 0,
    pinned: false,
    revision: 1,
    flags: 0,
    revisionTime: 0,
    shareId: mockShareId,
    state: ItemState.Active,
});

export const getMockPasskey = (): SanitizedPasskey => ({
    keyId: uniqueId(),
    content: '',
    domain: 'proton.me',
    rpId: '',
    rpName: '',
    userName: 'test@proton.me',
    userDisplayName: '',
    userId: '',
    createTime: 0,
    note: '',
    credentialId: '',
    userHandle: '',
});

export const getMockState = (): State => {
    const mockState = rootReducer(undefined, { type: '__TEST_INIT__' });
    mockState.shares['test-share-id'] = mockShare;
    mockState.items.byShareId[mockShareId] = { [mockItemId]: getMockItem() };

    /* clone deep to avoid referential equalities
     * with regards to selector memoisation in tests */
    return cloneDeep(mockState);
};
