import cloneDeep from 'lodash/cloneDeep';
import type { Runtime } from 'webextension-polyfill';

import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { SanitizedPasskey } from '@proton/pass/lib/passkeys/types';
import { type ShareItem, rootReducer } from '@proton/pass/store/reducers';
import type { State } from '@proton/pass/store/types';
import type { ItemRevision, TabId } from '@proton/pass/types';
import { ContentFormatVersion, ItemState, ShareRole, ShareType } from '@proton/pass/types';
import { partialMerge } from '@proton/pass/utils/object/merge';
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
    shareRoleId: ShareRole.MANAGER,
    targetId: uniqueId(),
    targetMaxMembers: 1,
    targetMembers: 1,
    targetType: ShareType.Vault,
    vaultId: uniqueId(),
    canAutofill: true,
    flags: 0,
};

export const getMockItemRevision = (revision: Partial<ItemRevision> = {}): ItemRevision =>
    partialMerge<ItemRevision>(
        {
            aliasEmail: null,
            contentFormatVersion: ContentFormatVersion.Item,
            createTime: 0,
            data: itemBuilder('login').data,
            itemId: uniqueId(),
            lastUseTime: 0,
            modifyTime: 0,
            pinned: false,
            revision: 1,
            flags: 0,
            revisionTime: 0,
            shareId: mockShareId,
            state: ItemState.Active,
            shareCount: 0,
        },
        revision
    );

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
    mockState.shares[mockShareId] = mockShare;
    mockState.items.byShareId[mockShareId] = { [mockItemId]: getMockItemRevision() };

    /* clone deep to avoid referential equalities
     * with regards to selector memoisation in tests */
    return cloneDeep(mockState);
};

export let sender: Runtime.MessageSender;
export const setMockMessageSender = (url: string, tabId: TabId = -1) =>
    (sender = { tab: { id: tabId, url }, url } as unknown as Runtime.MessageSender);
