import cloneDeep from 'lodash/cloneDeep';
import type { Runtime } from 'webextension-polyfill';

import type { SanitizedPasskey } from '@proton/pass/lib/passkeys/types';
import { type ShareItem, rootReducer } from '@proton/pass/store/reducers';
import type { State } from '@proton/pass/store/types';
import type { ItemRevision, TabId } from '@proton/pass/types';
import { ShareRole } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { createTestItem } from '@proton/pass/utils/tests/fixtures/items';
import { createTestShare } from '@proton/pass/utils/tests/fixtures/shares';

export const mockShareId = uniqueId();
export const mockItemId = uniqueId();

export const mockShare: ShareItem = createTestShare({
    shareId: mockShareId,
    shareRoleId: ShareRole.MANAGER,
    owner: true,
    canAutofill: true,
});

export const getMockItemRevision = (revision: Partial<ItemRevision> = {}): ItemRevision =>
    createTestItem('login', { shareId: mockShareId, ...revision });

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
    mockState.sharesDedupe = { dedupe: [mockShareId], dedupeAndVisible: [mockShareId] };
    mockState.items.byShareId[mockShareId] = { [mockItemId]: getMockItemRevision() };

    /* clone deep to avoid referential equalities
     * with regards to selector memoisation in tests */
    return cloneDeep(mockState);
};

export let sender: Runtime.MessageSender;

export const setMockMessageSender = (url: string, tabId: TabId = -1, frameUrl = url, frameId = 0) =>
    (sender = {
        tab: { id: tabId, url },
        url: frameUrl,
        frameId,
    } as Runtime.MessageSender);
