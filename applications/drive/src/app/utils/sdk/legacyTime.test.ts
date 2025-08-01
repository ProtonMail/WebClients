import { MemberRole, NodeType, RevisionState } from '@proton/drive';
import type { Author, NodeEntity, Revision } from '@proton/drive';

import { dateToLegacyTimestamp, getLegacyModifiedTime, getLegacyTrashedTime } from './legacyTime';

describe('legacyTime utilities', () => {
    const mockAuthor: Author = {
        ok: true,
        value: 'test@proton.me',
    };

    const createTime = new Date('2023-01-01T00:00:00.000Z');
    const modificationTime = new Date('2023-01-02T12:00:00.000Z');
    const trashTime = new Date('2023-01-03T15:30:00.000Z');

    const createMockNode = (overrides: Partial<NodeEntity> = {}): NodeEntity => ({
        uid: 'vol~link',
        parentUid: 'vol~parent',
        deprecatedShareId: 'share123',
        name: 'test-file.txt',
        keyAuthor: mockAuthor,
        nameAuthor: mockAuthor,
        directMemberRole: MemberRole.Admin,
        type: NodeType.File,
        mediaType: 'text/plain',
        isShared: false,
        creationTime: createTime,
        trashTime: undefined,
        totalStorageSize: 1024,
        activeRevision: undefined,
        folder: undefined,
        treeEventScopeId: 'tree-event-scope-id',
        ...overrides,
    });

    const createMockRevision = (overrides: Partial<Revision> = {}): Revision => ({
        uid: 'vol~link~rev',
        state: RevisionState.Active,
        creationTime: new Date('2023-01-01T06:00:00.000Z'),
        contentAuthor: mockAuthor,
        storageSize: 1024,
        claimedSize: 1000,
        claimedModificationTime: modificationTime,
        claimedDigests: { sha1: 'abc123' },
        claimedAdditionalMetadata: {},
        ...overrides,
    });

    describe('dateToLegacyTimestamp', () => {
        it('should convert date to Unix timestamp in seconds', () => {
            const date = new Date('2023-01-01T00:00:00.000Z');
            const expectedTimestamp = Math.floor(date.getTime() / 1000);

            expect(dateToLegacyTimestamp(date)).toBe(expectedTimestamp);
        });
    });

    describe('getLegacyModifiedTime', () => {
        it('should return claimedModificationTime when available', () => {
            const mockRevision = createMockRevision();
            const node = createMockNode({ activeRevision: mockRevision });

            const result = getLegacyModifiedTime(node);
            expect(result).toBe(Math.floor(modificationTime.getTime() / 1000));
        });

        it('should fallback to node creationTime when claimedModificationTime is not available', () => {
            const mockRevision = createMockRevision({ claimedModificationTime: undefined });
            const node = createMockNode({ activeRevision: mockRevision });

            const result = getLegacyModifiedTime(node);
            expect(result).toBe(Math.floor(createTime.getTime() / 1000));
        });

        it('should fallback to node creationTime when activeRevision is not available', () => {
            const node = createMockNode({
                name: 'test-folder',
                type: NodeType.Folder,
                mediaType: undefined,
                totalStorageSize: 0,
                folder: {
                    claimedModificationTime: undefined,
                },
            });

            const result = getLegacyModifiedTime(node);
            expect(result).toBe(Math.floor(createTime.getTime() / 1000));
        });
    });

    describe('getLegacyTrashedTime', () => {
        it('should return trashed timestamp when trashTime is available', () => {
            const node = createMockNode({ trashTime: trashTime });

            const result = getLegacyTrashedTime(node);
            expect(result).toBe(Math.floor(trashTime.getTime() / 1000));
        });

        it('should return null when trashTime is not available', () => {
            const node = createMockNode();

            const result = getLegacyTrashedTime(node);
            expect(result).toBeNull();
        });
    });
});
