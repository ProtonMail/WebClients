import type { DegradedNode, MemberRole, NodeEntity, NodeType, RevisionState } from '@proton/drive/index';

const DEFAULT_MEMBER_ROLE: MemberRole = 'admin' as MemberRole;
const DEFAULT_NODE_TYPE: NodeType = 'file' as NodeType;
const DEFAULT_REVISION_STATE: RevisionState = 'active' as RevisionState;

export const createMockNodeEntity = (overrides: Partial<NodeEntity> = {}): NodeEntity => ({
    uid: 'node-uid',
    parentUid: undefined,
    name: 'mock-file.txt',
    keyAuthor: {
        ok: true,
        value: 'key-author',
    },
    nameAuthor: {
        ok: true,
        value: 'name-author',
    },
    directRole: DEFAULT_MEMBER_ROLE,
    type: DEFAULT_NODE_TYPE,
    mediaType: 'application/octet-stream',
    isShared: false,
    isSharedPublicly: false,
    creationTime: new Date('2024-01-01T00:00:00Z'),
    modificationTime: new Date('2024-01-01T01:00:00Z'),
    trashTime: undefined,
    totalStorageSize: 0,
    activeRevision: {
        uid: 'revision-uid',
        state: DEFAULT_REVISION_STATE,
        creationTime: new Date('2024-01-01T00:00:00Z'),
        contentAuthor: {
            ok: true,
            value: 'content-author',
        },
        storageSize: 1024,
    },
    folder: undefined,
    treeEventScopeId: 'tree-scope-id',
    ...overrides,
});

export const createMockDegradedNode = (overrides: Partial<DegradedNode> = {}): DegradedNode => ({
    uid: 'node-uid',
    parentUid: undefined,
    name: { ok: true, value: 'mock-file.txt' },
    keyAuthor: {
        ok: true,
        value: 'key-author',
    },
    nameAuthor: {
        ok: true,
        value: 'name-author',
    },
    directRole: DEFAULT_MEMBER_ROLE,
    type: DEFAULT_NODE_TYPE,
    mediaType: 'application/octet-stream',
    isShared: false,
    isSharedPublicly: false,
    creationTime: new Date('2024-01-01T00:00:00Z'),
    modificationTime: new Date('2024-01-01T01:00:00Z'),
    trashTime: undefined,
    totalStorageSize: 0,
    activeRevision: {
        ok: true,
        value: {
            uid: 'revision-uid',
            state: DEFAULT_REVISION_STATE,
            creationTime: new Date('2024-01-01T00:00:00Z'),
            contentAuthor: {
                ok: true,
                value: 'content-author',
            },
            storageSize: 1024,
        },
    },
    folder: undefined,
    treeEventScopeId: 'tree-scope-id',
    ...overrides,
});
