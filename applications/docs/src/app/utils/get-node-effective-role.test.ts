import type { NodeEntity, ProtonDriveClient } from '@proton/drive/index'
import { MemberRole, NodeType } from '@proton/drive/index'

import { getHigherRole, getNodeEffectiveRole } from './get-node-effective-role'

describe('getNodeEffectiveRole', () => {
  let mockDrive: jest.Mocked<Pick<ProtonDriveClient, 'getNode'>>

  const createMockNode = (
    uid: string,
    directRole: MemberRole = MemberRole.Viewer,
    parentUid?: string,
    type: NodeType = NodeType.Folder,
  ): NodeEntity => ({
    uid,
    parentUid,
    directRole,
    name: { ok: true as const, value: `node-${uid}` },
    keyAuthor: { ok: true, value: 'test@proton.me' },
    nameAuthor: { ok: true, value: 'test@proton.me' },
    type,
    mediaType: 'text/plain',
    isShared: false,
    isSharedPublicly: false,
    creationTime: new Date(),
    modificationTime: new Date(),
    trashTime: undefined,
    totalStorageSize: 0,
    activeRevision: undefined,
    folder: undefined,
    treeEventScopeId: 'treeEventScopeId',
    ownedBy: {},
  })

  beforeEach(() => {
    mockDrive = {
      getNode: jest.fn(),
    } as any
  })

  describe('short circuit when role is Admin', () => {
    it('without calling drive.getNode when role argument is Admin', async () => {
      const node = createMockNode('node', MemberRole.Viewer, 'parent-uid')
      mockDrive.getNode.mockResolvedValue(createMockNode('parent', MemberRole.Editor))

      const result = await getNodeEffectiveRole(mockDrive, node, MemberRole.Admin)

      expect(result).toBe(MemberRole.Admin)
      expect(mockDrive.getNode).not.toHaveBeenCalled()
    })

    it('without traversing to parent when node.directRole is Admin', async () => {
      const node = createMockNode('node', MemberRole.Admin, 'parent-uid')

      const result = await getNodeEffectiveRole(mockDrive, node)

      expect(result).toBe(MemberRole.Admin)
      expect(mockDrive.getNode).not.toHaveBeenCalled()
    })

    it('without calling grandparent when parent has Admin', async () => {
      const parentNode = createMockNode('parent-node', MemberRole.Admin, 'grandparent-node')
      const childNode = createMockNode('child-node', MemberRole.Viewer, 'parent-node')

      mockDrive.getNode.mockResolvedValueOnce(parentNode)

      const result = await getNodeEffectiveRole(mockDrive, childNode)

      expect(mockDrive.getNode).toHaveBeenCalledTimes(1)
      expect(mockDrive.getNode).toHaveBeenCalledWith('parent-node')
      expect(mockDrive.getNode).not.toHaveBeenCalledWith('grandparent-node')
      expect(result).toBe(MemberRole.Admin)
    })
  })

  describe('get the highest role along the tree', () => {
    it('returns highest role when node is Viewer, parent Editor, second parent Viewer, third parent Admin', async () => {
      const parent3 = createMockNode('p3', MemberRole.Admin)
      const parent2 = createMockNode('p2', MemberRole.Viewer, 'p3')
      const parent1 = createMockNode('p1', MemberRole.Editor, 'p2')
      const node = createMockNode('node', MemberRole.Viewer, 'p1')

      mockDrive.getNode.mockResolvedValueOnce(parent1).mockResolvedValueOnce(parent2).mockResolvedValueOnce(parent3)

      const result = await getNodeEffectiveRole(mockDrive, node)

      expect(result).toBe(MemberRole.Admin)
      expect(mockDrive.getNode).toHaveBeenCalledWith('p1')
      expect(mockDrive.getNode).toHaveBeenCalledWith('p2')
      expect(mockDrive.getNode).toHaveBeenCalledWith('p3')
    })

    it('returns the node direct role when no role provided', async () => {
      const node = createMockNode('root-node', MemberRole.Editor)
      const result = await getNodeEffectiveRole(mockDrive, node)

      expect(result).toBe(MemberRole.Editor)
      expect(mockDrive.getNode).not.toHaveBeenCalled()
    })
  })

  describe('never returns Inherited role', () => {
    it('returns Viewer and reports the error', async () => {
      const node = createMockNode('root-node', MemberRole.Inherited)

      const result = await getNodeEffectiveRole(mockDrive, node)

      expect(result).toBe(MemberRole.Viewer)
      expect(mockDrive.getNode).not.toHaveBeenCalled()
    })
  })
})

describe('getHigherRole', () => {
  const roles = [MemberRole.Inherited, MemberRole.Viewer, MemberRole.Editor, MemberRole.Admin] as const

  it('returns the higher of the two roles for all 16 combinations', () => {
    const expected: Record<MemberRole, Record<MemberRole, MemberRole>> = {
      [MemberRole.Inherited]: {
        [MemberRole.Inherited]: MemberRole.Inherited,
        [MemberRole.Viewer]: MemberRole.Viewer,
        [MemberRole.Editor]: MemberRole.Editor,
        [MemberRole.Admin]: MemberRole.Admin,
      },
      [MemberRole.Viewer]: {
        [MemberRole.Inherited]: MemberRole.Viewer,
        [MemberRole.Viewer]: MemberRole.Viewer,
        [MemberRole.Editor]: MemberRole.Editor,
        [MemberRole.Admin]: MemberRole.Admin,
      },
      [MemberRole.Editor]: {
        [MemberRole.Inherited]: MemberRole.Editor,
        [MemberRole.Viewer]: MemberRole.Editor,
        [MemberRole.Editor]: MemberRole.Editor,
        [MemberRole.Admin]: MemberRole.Admin,
      },
      [MemberRole.Admin]: {
        [MemberRole.Inherited]: MemberRole.Admin,
        [MemberRole.Viewer]: MemberRole.Admin,
        [MemberRole.Editor]: MemberRole.Admin,
        [MemberRole.Admin]: MemberRole.Admin,
      },
    }

    for (const role1 of roles) {
      for (const role2 of roles) {
        expect(getHigherRole(role1, role2)).toBe(expected[role1][role2])
      }
    }
  })
})
