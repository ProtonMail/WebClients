import { act, renderHook } from '@testing-library/react-hooks';

import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';

import type { DriveEvents } from '../_events';
import type { DecryptedLink, EncryptedLink, LinkShareUrl } from './interface';
import type { Link, LinksState } from './useLinksState';
import {
    addOrUpdate,
    deleteLinks,
    setCachedThumbnailUrl,
    setLock,
    updateByEvents,
    useLinksStateProvider,
} from './useLinksState';

jest.mock('../_events/useDriveEventManager', () => {
    const useDriveEventManager = () => {
        return {
            eventHandlers: {
                register: () => 'id',
                unregister: () => false,
            },
        };
    };
    return {
        useDriveEventManager,
    };
});

function generateTestLink({
    id,
    parentId,
    decrypted,
    shareId,
    rootShareId = 'defaultShareId',
}: {
    id: string;
    parentId: string | undefined;
    decrypted?: boolean;
    shareId?: string;
    rootShareId?: string;
}): Link {
    return {
        encrypted: {
            linkId: id,
            name: id,
            parentLinkId: parentId,
            sharingDetails: {
                shareId,
            },
            rootShareId,
        },
        decrypted: decrypted
            ? {
                  linkId: id,
                  name: id,
                  parentLinkId: parentId,
                  sharingDetails: {
                      shareId,
                  },
                  rootShareId,
              }
            : undefined,
    } as Link;
}

function getLockedIds(state: LinksState): string[] {
    return Object.values(state.shareId.links)
        .filter(({ decrypted }) => decrypted?.isLocked)
        .map(({ encrypted }) => encrypted.linkId);
}

function generateEvents(events: any[]): DriveEvents {
    return {
        eventId: 'eventId',
        events: events.map(([eventType, encryptedLink]) => ({ eventType, encryptedLink })),
        refresh: false,
    };
}

describe('useLinksState', () => {
    let state: LinksState;

    beforeEach(() => {
        state = {
            shareId: {
                links: {
                    linkId0: generateTestLink({ id: 'linkId0', parentId: undefined }),
                    linkId1: generateTestLink({ id: 'linkId1', parentId: 'linkId0' }),
                    linkId2: generateTestLink({ id: 'linkId2', parentId: 'linkId1' }),
                    linkId3: generateTestLink({ id: 'linkId3', parentId: 'linkId1' }),
                    linkId4: generateTestLink({ id: 'linkId4', parentId: 'linkId0' }),
                    linkId5: generateTestLink({
                        id: 'linkId5',
                        parentId: 'linkId4',
                        shareId: 'shareId1',
                        rootShareId: 'shareId0',
                    }),
                    linkId6: generateTestLink({
                        id: 'linkId6',
                        parentId: 'linkId4',
                        shareId: 'shareId2',
                        rootShareId: 'shareId2',
                    }),
                    linkId7: generateTestLink({ id: 'linkId7', parentId: 'linkId0', decrypted: true }),
                    linkId8: generateTestLink({ id: 'linkId8', parentId: 'linkId7', decrypted: true }),
                    linkId9: generateTestLink({ id: 'linkId9', parentId: 'linkId7', decrypted: true }),
                },
                tree: {
                    linkId0: ['linkId1', 'linkId4', 'linkId7'],
                    linkId1: ['linkId2', 'linkId3'],
                    linkId4: ['linkId5', 'linkId6'],
                    linkId7: ['linkId8', 'linkId9'],
                },
            },
        };
    });

    it('deletes links', () => {
        const result = deleteLinks(state, 'shareId', ['linkId1', 'linkId2', 'linkId6', 'linkId8', 'linkId9']);
        // Removed links from links.
        expect(Object.keys(result.shareId.links)).toMatchObject(['linkId0', 'linkId4', 'linkId5', 'linkId7']);
        // Removed parent from tree.
        expect(Object.keys(result.shareId.tree)).toMatchObject(['linkId0', 'linkId4', 'linkId7']);
        // Removed children from tree.
        expect(result.shareId.tree.linkId4).toMatchObject(['linkId5']);
    });

    it('adds new encrypted link', () => {
        const result = addOrUpdate(state, 'shareId', [
            {
                encrypted: {
                    linkId: 'newLink',
                    name: 'newLink',
                    parentLinkId: 'linkId1',
                } as EncryptedLink,
            },
        ]);
        // Added to links.
        expect(result.shareId.links.newLink).toMatchObject({
            encrypted: { linkId: 'newLink' },
        });
        // Added to tree as child to its parent.
        expect(result.shareId.tree.linkId1).toMatchObject(['linkId2', 'linkId3', 'newLink']);
    });

    it('adds link to new share', () => {
        const result = addOrUpdate(state, 'shareId2', [
            {
                encrypted: {
                    linkId: 'newLink',
                    name: 'newLink',
                    parentLinkId: 'linkId1',
                } as EncryptedLink,
            },
        ]);
        // Added new link to links.
        expect(result.shareId2.links.newLink).toMatchObject({
            encrypted: { linkId: 'newLink' },
        });
        // Added parent to tree.
        expect(Object.keys(result.shareId2.tree)).toMatchObject(['linkId1']);
        expect(result.shareId2.tree.linkId1).toMatchObject(['newLink']);
    });

    it('updates encrypted link', () => {
        const result = addOrUpdate(state, 'shareId', [
            {
                encrypted: {
                    linkId: 'linkId7',
                    name: 'new name',
                    parentLinkId: 'linkId0',
                } as EncryptedLink,
            },
        ]);
        expect(result.shareId.links.linkId7).toMatchObject({
            decrypted: { linkId: 'linkId7', name: 'linkId7', isStale: true },
            encrypted: { linkId: 'linkId7' },
        });
    });

    it('updates encrypted link without need to re-decrypt', () => {
        const result = addOrUpdate(state, 'shareId', [
            {
                encrypted: {
                    linkId: 'linkId7',
                    name: 'linkId7',
                    parentLinkId: 'linkId0',
                } as EncryptedLink,
            },
        ]);
        expect(result.shareId.links.linkId7).toMatchObject({
            decrypted: { linkId: 'linkId7', name: 'linkId7', isStale: false },
            encrypted: { linkId: 'linkId7' },
        });
    });

    it('updates encrypted link with different parent', () => {
        const result = addOrUpdate(state, 'shareId', [
            {
                encrypted: {
                    linkId: 'linkId7',
                    name: 'linkId7',
                    parentLinkId: 'linkId6',
                } as EncryptedLink,
            },
        ]);
        // Updated link in links.
        expect(result.shareId.links.linkId7).toMatchObject({
            decrypted: { linkId: 'linkId7', isStale: true }, // Changing parent requires to re-decrypt again.
            encrypted: { linkId: 'linkId7' },
        });
        // Updated original parent tree.
        expect(result.shareId.tree.linkId0).toMatchObject(['linkId1', 'linkId4']);
        // Updated new parent tree.
        expect(result.shareId.tree.linkId6).toMatchObject(['linkId7']);
    });

    it('updates decrypted link', () => {
        const result = addOrUpdate(state, 'shareId', [
            {
                encrypted: {
                    linkId: 'linkId7',
                    name: 'new name',
                    parentLinkId: 'linkId0',
                } as EncryptedLink,
                decrypted: {
                    linkId: 'linkId7',
                    name: 'new name',
                    parentLinkId: 'linkId0',
                } as DecryptedLink,
            },
        ]);
        expect(result.shareId.links.linkId7).toMatchObject({
            decrypted: { linkId: 'linkId7', name: 'new name' },
            encrypted: { linkId: 'linkId7' },
        });
    });

    it('updates trashed link', () => {
        const result1 = addOrUpdate(state, 'shareId', [
            {
                encrypted: {
                    linkId: 'linkId7',
                    name: 'linkId7',
                    parentLinkId: 'linkId0',
                    trashed: 12345678,
                } as EncryptedLink,
            },
            {
                encrypted: {
                    linkId: 'linkId8',
                    name: 'linkId8',
                    parentLinkId: 'linkId7',
                    trashed: 123456789,
                } as EncryptedLink,
            },
        ]);
        expect(result1.shareId.links.linkId7).toMatchObject({
            decrypted: { linkId: 'linkId7', name: 'linkId7', isStale: false },
            encrypted: { linkId: 'linkId7' },
        });
        // Trashed link is removed from the parent.
        expect(result1.shareId.tree.linkId0).toMatchObject(['linkId1', 'linkId4']);
        // Trashed parent trashes automatically also children.
        expect(result1.shareId.links.linkId7.encrypted.trashed).toBe(12345678);
        expect(result1.shareId.links.linkId7.encrypted.trashedByParent).toBeFalsy();
        expect(result1.shareId.links.linkId8.encrypted.trashed).toBe(123456789);
        expect(result1.shareId.links.linkId8.encrypted.trashedByParent).toBeFalsy();
        expect(result1.shareId.links.linkId9.encrypted.trashed).toBe(12345678);
        expect(result1.shareId.links.linkId9.encrypted.trashedByParent).toBeTruthy();

        // Restoring from trash re-adds link back to its parent.
        const result2 = addOrUpdate(result1, 'shareId', [
            {
                encrypted: {
                    linkId: 'linkId7',
                    name: 'linkId7',
                    parentLinkId: 'linkId0',
                    trashed: null,
                } as EncryptedLink,
            },
        ]);
        expect(result2.shareId.tree.linkId0).toMatchObject(['linkId1', 'linkId4', 'linkId7']);
        // Restoring from trash removes also trashed flag to its children which were trashed with it.
        expect(result1.shareId.links.linkId7.encrypted.trashed).toBe(null);
        expect(result1.shareId.links.linkId7.encrypted.trashedByParent).toBeFalsy();
        expect(result1.shareId.links.linkId8.encrypted.trashed).toBe(123456789);
        expect(result1.shareId.links.linkId8.encrypted.trashedByParent).toBeFalsy();
        expect(result1.shareId.links.linkId9.encrypted.trashed).toBe(null);
        expect(result1.shareId.links.linkId9.encrypted.trashedByParent).toBeFalsy();
    });

    it('updates trashed folder and adds files to it', () => {
        const result1 = addOrUpdate(state, 'shareId', [
            {
                encrypted: {
                    linkId: 'linkId7',
                    name: 'linkId7',
                    parentLinkId: 'linkId0',
                    trashed: 12345678,
                } as EncryptedLink,
            },
            {
                encrypted: {
                    linkId: 'linkId7a',
                    name: 'linkId7a',
                    parentLinkId: 'linkId7',
                } as EncryptedLink,
            },
        ]);
        // Children of trashed parent is added to tree structure.
        expect(result1.shareId.tree.linkId7).toMatchObject(['linkId8', 'linkId9', 'linkId7a']);
        // Trashed parent trashes automatically also children.
        expect(result1.shareId.links.linkId7.encrypted.trashed).toBe(12345678);
        expect(result1.shareId.links.linkId7.encrypted.trashedByParent).toBeFalsy();
        expect(result1.shareId.links.linkId7a.encrypted.trashed).toBe(12345678);
        expect(result1.shareId.links.linkId7a.encrypted.trashedByParent).toBeTruthy();

        // Restoring from trash re-adds link back to its parent.
        const result2 = addOrUpdate(result1, 'shareId', [
            {
                encrypted: {
                    linkId: 'linkId7',
                    name: 'linkId7',
                    parentLinkId: 'linkId0',
                    trashed: null,
                } as EncryptedLink,
            },
        ]);
        // Trashed parent trashes automatically also children.
        expect(result2.shareId.links.linkId7.encrypted.trashed).toBe(null);
        expect(result2.shareId.links.linkId7.encrypted.trashedByParent).toBeFalsy();
        expect(result2.shareId.links.linkId7a.encrypted.trashed).toBe(null);
        expect(result2.shareId.links.linkId7a.encrypted.trashedByParent).toBeFalsy();
    });

    it('updates encrypted link with signature issue', () => {
        // First, it sets signature issue.
        const result1 = addOrUpdate(state, 'shareId', [
            {
                encrypted: {
                    linkId: 'linkId7',
                    name: 'linkId7',
                    parentLinkId: 'linkId0',
                    signatureIssues: { name: 2 },
                } as unknown as EncryptedLink,
            },
        ]);
        expect(result1.shareId.links.linkId7).toMatchObject({
            decrypted: { linkId: 'linkId7', signatureIssues: { name: 2 } },
            encrypted: { linkId: 'linkId7', signatureIssues: { name: 2 } },
        });
        // Second, it keeps it even if we do another update which doesnt change
        // how the link is encrypted (keys and encrypted data are the same).
        const result2 = addOrUpdate(result1, 'shareId', [
            {
                encrypted: {
                    linkId: 'linkId7',
                    name: 'linkId7',
                    parentLinkId: 'linkId0',
                } as unknown as EncryptedLink,
            },
        ]);
        expect(result2.shareId.links.linkId7).toMatchObject({
            decrypted: { linkId: 'linkId7', signatureIssues: { name: 2 } },
            encrypted: { linkId: 'linkId7', signatureIssues: { name: 2 } },
        });
        // Third, signature issue is cleared if keys or encrypted data is changed.
        const result3 = addOrUpdate(result2, 'shareId', [
            {
                encrypted: {
                    linkId: 'linkId7',
                    name: 'linkId7',
                    parentLinkId: 'linkId0',
                    nodeKey: 'anotherKey',
                } as unknown as EncryptedLink,
            },
        ]);
        expect(result3.shareId.links.linkId7).toMatchObject({
            decrypted: { linkId: 'linkId7', signatureIssues: undefined },
            encrypted: { linkId: 'linkId7', signatureIssues: undefined },
        });
    });

    it('updates decrypted link with signature issue', () => {
        const result = addOrUpdate(state, 'shareId', [
            {
                encrypted: {
                    linkId: 'linkId7',
                    name: 'linkId7',
                    parentLinkId: 'linkId0',
                } as unknown as EncryptedLink,
                decrypted: {
                    linkId: 'linkId7',
                    name: 'linkId7',
                    parentLinkId: 'linkId0',
                    signatureIssues: { name: 2 },
                } as unknown as DecryptedLink,
            },
        ]);
        expect(result.shareId.links.linkId7).toMatchObject({
            decrypted: { linkId: 'linkId7', signatureIssues: { name: 2 } },
            encrypted: { linkId: 'linkId7', signatureIssues: { name: 2 } },
        });
    });

    it('locks and unlocks links', () => {
        const result1 = setLock(state, 'shareId', ['linkId7', 'linkId8'], true);
        expect(getLockedIds(result1)).toMatchObject(['linkId7', 'linkId8']);
        const result2 = setLock(state, 'shareId', ['linkId8'], false);
        expect(getLockedIds(result2)).toMatchObject(['linkId7']);
    });

    it('locks and unlocks trashed links', () => {
        (state.shareId.links.linkId7.decrypted as DecryptedLink).trashed = 1234;
        (state.shareId.links.linkId8.decrypted as DecryptedLink).trashed = 5678;
        const result1 = setLock(state, 'shareId', 'trash', true);
        expect(getLockedIds(result1)).toMatchObject(['linkId7', 'linkId8']);
        const result2 = setLock(state, 'shareId', 'trash', false);
        expect(getLockedIds(result2)).toMatchObject([]);
    });

    it('preserves lock for newly added trashed link', () => {
        const result1 = setLock(state, 'shareId', 'trash', true);
        const result2 = addOrUpdate(result1, 'shareId', [
            {
                encrypted: {
                    linkId: 'linkId100',
                    name: 'linkId100',
                    parentLinkId: 'linkId0',
                    trashed: 12345678,
                } as EncryptedLink,
                decrypted: {
                    linkId: 'linkId100',
                    name: 'linkId100',
                    parentLinkId: 'linkId0',
                    trashed: 12345678,
                } as DecryptedLink,
            },
            {
                encrypted: {
                    linkId: 'linkId101',
                    name: 'linkId101',
                    parentLinkId: 'linkId0',
                    trashed: 12345678900, // Way in future after setLock was called.
                } as EncryptedLink,
                decrypted: {
                    linkId: 'linkId101',
                    name: 'linkId101',
                    parentLinkId: 'linkId0',
                    trashed: 12345678900,
                } as DecryptedLink,
            },
        ]);
        // linkId101 was deleted after our empty action, so is not locked.
        expect(getLockedIds(result2)).toMatchObject(['linkId100']);
    });

    it('sets cached thumbnail', () => {
        const result = setCachedThumbnailUrl(state, 'shareId', 'linkId7', 'cachedurl');
        expect(result.shareId.links.linkId7.decrypted).toMatchObject({ cachedThumbnailUrl: 'cachedurl' });
    });

    it('preserves cached lock flag', () => {
        const state2 = setLock(state, 'shareId', ['linkId7'], true);
        const link = {
            linkId: 'linkId7',
            name: 'new name',
            parentLinkId: 'linkId0',
        };
        const result = addOrUpdate(state2, 'shareId', [
            {
                encrypted: link as EncryptedLink,
                decrypted: link as DecryptedLink,
            },
        ]);
        expect(result.shareId.links.linkId7.decrypted).toMatchObject({ isLocked: true });
    });

    it('preserves cached thumbnail', () => {
        const state2 = setCachedThumbnailUrl(state, 'shareId', 'linkId7', 'cachedurl');
        const link = {
            linkId: 'linkId7',
            name: 'new name',
            parentLinkId: 'linkId0',
        };
        const result = addOrUpdate(state2, 'shareId', [
            {
                encrypted: link as EncryptedLink,
                decrypted: link as DecryptedLink,
            },
        ]);
        expect(result.shareId.links.linkId7.decrypted).toMatchObject({ cachedThumbnailUrl: 'cachedurl' });
    });

    it('does not preserve cached thumbnail when revision changed', () => {
        const state2 = setCachedThumbnailUrl(state, 'shareId', 'linkId7', 'cachedurl');
        const link = {
            linkId: 'linkId7',
            name: 'new name',
            parentLinkId: 'linkId0',
            activeRevision: { id: 'newId' },
        };
        const result = addOrUpdate(state2, 'shareId', [
            {
                encrypted: link as EncryptedLink,
                decrypted: link as DecryptedLink,
            },
        ]);
        expect(result.shareId.links.linkId7.decrypted).toMatchObject({ cachedThumbnailUrl: undefined });
    });

    it('preserves latest share url num accesses', () => {
        expect(state.shareId.links.linkId7.decrypted?.shareUrl?.numAccesses).toBe(undefined);

        // First set the numAccesses and check its set.
        const linkWithAccesses = {
            linkId: 'linkId7',
            name: 'new name',
            parentLinkId: 'linkId0',
            shareUrl: {
                id: 'shareUrlId',
                numAccesses: 0, // Test with zero to make sure zero is also well handled.
            },
        };
        const result1 = addOrUpdate(state, 'shareId', [
            {
                encrypted: linkWithAccesses as EncryptedLink,
                decrypted: linkWithAccesses as DecryptedLink,
            },
        ]);
        expect(result1.shareId.links.linkId7.decrypted?.shareUrl?.numAccesses).toBe(0);

        // Then set newer link without numAccesses which stil preserves the previous value.
        const linkWithoutAccesses = {
            linkId: 'linkId7',
            name: 'newer name',
            parentLinkId: 'linkId0',
            shareUrl: {
                id: 'shareUrlId',
            },
        };
        const result2 = addOrUpdate(state, 'shareId', [
            {
                encrypted: linkWithoutAccesses as EncryptedLink,
                decrypted: linkWithoutAccesses as DecryptedLink,
            },
        ]);
        expect(result2.shareId.links.linkId7.decrypted?.shareUrl?.numAccesses).toBe(0);
    });

    it('sets zero num accesses for fresh new share url', () => {
        (state.shareId.links.linkId7.decrypted as DecryptedLink).shareUrl = undefined;
        (state.shareId.links.linkId8.decrypted as DecryptedLink).shareUrl = {
            id: 'shareUrlId',
        } as LinkShareUrl;
        const link7 = {
            linkId: 'linkId7',
            name: 'new name',
            parentLinkId: 'linkId0',
            shareUrl: {
                id: 'shareUrlId1',
            },
        };
        const link8 = {
            linkId: 'linkId8',
            name: 'new name',
            parentLinkId: 'linkId7',
            shareUrl: {
                id: 'shareUrlId2',
            },
        };
        const result = addOrUpdate(state, 'shareId', [
            {
                encrypted: link7 as EncryptedLink,
                decrypted: link7 as DecryptedLink,
            },
            {
                encrypted: link8 as EncryptedLink,
                decrypted: link8 as DecryptedLink,
            },
        ]);
        // Link 7 had no shareUrl before, that means it is freshly created, so set to 0.
        expect(result.shareId.links.linkId7.decrypted?.shareUrl?.numAccesses).toBe(0);
        // Whereas link 8 had shareUrl before, so the update is about something else, and we need to keep undefined.
        expect(result.shareId.links.linkId8.decrypted?.shareUrl?.numAccesses).toBe(undefined);
    });

    it('processes events', () => {
        const result = updateByEvents(
            state,
            generateEvents([
                [
                    EVENT_TYPES.CREATE,
                    { linkId: 'newLink', name: 'newLink', parentLinkId: 'linkId0', rootShareId: 'shareId' },
                ],
                [EVENT_TYPES.DELETE, { linkId: 'linkId1' }],
                [EVENT_TYPES.DELETE, { linkId: 'linkId4' }],
                [
                    EVENT_TYPES.UPDATE,
                    { linkId: 'linkId7', name: 'new name', parentLinkId: 'linkId0', rootShareId: 'shareId' },
                ],
            ]),
            jest.fn()
        );

        expect(Object.keys(result.shareId.links)).toMatchObject([
            'linkId0',
            'linkId7',
            'linkId8',
            'linkId9',
            'newLink',
        ]);
        expect(Object.keys(result.shareId.tree)).toMatchObject(['linkId0', 'linkId7']);
        expect(result.shareId.links.linkId7).toMatchObject({
            decrypted: { linkId: 'linkId7', name: 'linkId7', isStale: true },
            encrypted: { linkId: 'linkId7' },
        });
    });

    it('skips events from non-present share', () => {
        const result = updateByEvents(
            state,
            generateEvents([
                [
                    EVENT_TYPES.CREATE,
                    { linkId: 'newLink', name: 'newLink', parentLinkId: 'linkId0', rootShareId: 'shareId2' },
                ],
            ]),
            jest.fn()
        );

        expect(Object.keys(result)).toMatchObject(['shareId']);
    });

    describe('hook', () => {
        let hook: {
            current: ReturnType<typeof useLinksStateProvider>;
        };

        beforeEach(() => {
            const { result } = renderHook(() => useLinksStateProvider());
            hook = result;

            act(() => {
                state.shareId.links.linkId6.encrypted.shareUrl = {
                    id: 'shareUrlId',
                    token: 'token',
                    isExpired: false,
                    createTime: 12345,
                    expireTime: null,
                };
                state.shareId.links.linkId7.encrypted.trashed = 12345;
                state.shareId.links.linkId8.encrypted.trashed = 12345;
                state.shareId.links.linkId8.encrypted.trashedByParent = true;
                state.shareId.links.linkId9.encrypted.trashed = 12345;
                state.shareId.links.linkId9.encrypted.trashedByParent = true;
                hook.current.setLinks('shareId', Object.values(state.shareId.links));
            });
        });

        it('returns children of the parent', () => {
            const links = hook.current.getChildren('shareId', 'linkId1');
            expect(links.map((link) => link.encrypted.linkId)).toMatchObject(['linkId2', 'linkId3']);
        });

        it('returns trashed links', () => {
            const links = hook.current.getTrashed('shareId');
            expect(links.map((link) => link.encrypted.linkId)).toMatchObject(['linkId7']);
        });

        it('returns shared links', () => {
            const links = hook.current.getSharedByLink('shareId');
            expect(links.map((link) => link.encrypted.linkId)).toMatchObject(['linkId5']);
        });

        it('returns shared with me links', () => {
            const links = hook.current.getSharedWithMeByLink('shareId');
            expect(links.map((link) => link.encrypted.linkId)).toMatchObject(['linkId6']);
        });
    });
});
