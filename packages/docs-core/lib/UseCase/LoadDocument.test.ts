import { DocumentRole, Result } from '@proton/docs-shared'
import type { DecryptCommit } from './DecryptCommit'
import type { NodeMeta, PublicDriveCompat } from '@proton/drive-store'
import type { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'
import type { GetDocumentKeys } from './GetDocumentKeys'
import type { GetDocumentMeta } from './GetDocumentMeta'
import type { GetNode } from './GetNode'
import type { GetNodePermissions } from './GetNodePermissions'
import type { FetchMetaAndRawCommit } from './FetchMetaAndRawCommit'
import { LoadDocument } from './LoadDocument'
import type { LoggerInterface } from '@proton/utils/logs'
import { DocumentState, PublicDocumentState } from '../State/DocumentState'
import { DecryptedCommit } from '../Models/DecryptedCommit'
import { LoadLogger } from '../LoadLogger/LoadLogger'
import { SHARE_URL_PERMISSIONS } from '@proton/shared/lib/drive/permissions'

describe('LoadDocument', () => {
  let loadDocument: LoadDocument
  let mockCompatWrapper: jest.Mocked<DriveCompatWrapper>
  let mockGetDocumentMeta: jest.Mocked<GetDocumentMeta>
  let mockGetNode: jest.Mocked<GetNode>
  let mockDecryptCommit: jest.Mocked<DecryptCommit>
  let mockGetNodePermissions: jest.Mocked<GetNodePermissions>
  let mockLoadMetaAndCommit: jest.Mocked<FetchMetaAndRawCommit>
  let mockGetDocumentKeys: jest.Mocked<GetDocumentKeys>
  let mockLogger: jest.Mocked<LoggerInterface>

  const nodeMeta: NodeMeta = {
    volumeId: 'volume-1',
    linkId: 'link-1',
  }

  beforeEach(() => {
    jest.spyOn(LoadLogger, 'logEventRelativeToLoadTime').mockImplementation(jest.fn())
    mockCompatWrapper = {
      getCompat: jest.fn(),
    } as unknown as jest.Mocked<DriveCompatWrapper>

    mockGetDocumentMeta = {
      execute: jest.fn().mockResolvedValue(Result.ok({})),
    } as unknown as jest.Mocked<GetDocumentMeta>

    mockGetNode = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetNode>

    mockDecryptCommit = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DecryptCommit>

    mockGetNodePermissions = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetNodePermissions>

    mockLoadMetaAndCommit = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<FetchMetaAndRawCommit>

    mockGetDocumentKeys = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetDocumentKeys>

    mockLogger = {
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggerInterface>

    loadDocument = new LoadDocument(
      mockCompatWrapper,
      mockGetDocumentMeta,
      mockGetNode,
      mockDecryptCommit,
      mockGetNodePermissions,
      mockLoadMetaAndCommit,
      mockGetDocumentKeys,
      mockLogger,
    )
  })

  describe('executePrivate', () => {
    const mockNode = {
      name: 'test-doc',
      trashed: false,
    }

    const mockKeys = {
      documentContentKey: 'test-key',
      userOwnAddress: 'test@example.com',
    }

    const mockMeta = {
      latestCommitId: () => 'commit-1',
    }

    beforeEach(() => {
      mockGetNode.execute.mockResolvedValue(Result.ok({ node: mockNode, fromCache: false } as any))
      mockGetDocumentKeys.execute.mockResolvedValue(Result.ok({ keys: mockKeys as any, fromCache: false } as any))
      mockLoadMetaAndCommit.execute.mockResolvedValue(
        Result.ok({
          serverBasedMeta: mockMeta,
          latestCommit: undefined,
          realtimeToken: 'token-1',
        } as any),
      )
      mockGetNodePermissions.execute.mockResolvedValue(
        Result.ok({ role: new DocumentRole('Editor'), fromCache: false }),
      )
    })

    it('should successfully load a private document', async () => {
      const result = await loadDocument.executePrivate(nodeMeta)

      expect(result.isFailed()).toBe(false)
      expect(result.getValue().documentState).toBeInstanceOf(DocumentState)
    })

    it('should handle cached node and refresh from network', async () => {
      mockGetNode.execute
        .mockResolvedValueOnce(Result.ok({ node: mockNode, fromCache: true } as any))
        .mockResolvedValueOnce(Result.ok({ node: { ...mockNode, name: 'updated-name' }, fromCache: false } as any))

      await loadDocument.executePrivate(nodeMeta)

      expect(mockGetNode.execute).toHaveBeenCalledTimes(2)
      expect(mockGetNode.execute).toHaveBeenCalledWith(nodeMeta, { useCache: true })
      expect(mockGetNode.execute).toHaveBeenCalledWith(nodeMeta, { useCache: false })
    })

    it('should handle cached permissions and refresh from network', async () => {
      mockGetNodePermissions.execute
        .mockResolvedValueOnce(Result.ok({ role: new DocumentRole('Editor'), fromCache: true }))
        .mockResolvedValueOnce(Result.ok({ role: new DocumentRole('Viewer'), fromCache: false }))

      await loadDocument.executePrivate(nodeMeta)

      expect(mockGetNodePermissions.execute).toHaveBeenCalledTimes(2)
      expect(mockGetNodePermissions.execute).toHaveBeenCalledWith(nodeMeta, { useCache: true })
      expect(mockGetNodePermissions.execute).toHaveBeenCalledWith(nodeMeta, { useCache: false })
    })

    it('should handle failed node loading', async () => {
      mockGetNode.execute.mockResolvedValue(Result.fail('Node loading failed'))

      const result = await loadDocument.executePrivate(nodeMeta)

      expect(result.isFailed()).toBe(true)
      expect(result.getError()).toBe('Node loading failed')
    })

    it('should handle failed keys loading', async () => {
      mockGetDocumentKeys.execute.mockResolvedValue(Result.fail('Keys loading failed'))

      const result = await loadDocument.executePrivate(nodeMeta)

      expect(result.isFailed()).toBe(true)
      expect(result.getError()).toBe('Keys loading failed')
    })

    it('should handle commit decryption when commit exists', async () => {
      const mockCommit = { updates: { documentUpdates: [] } }
      mockLoadMetaAndCommit.execute.mockResolvedValue(
        Result.ok({
          serverBasedMeta: mockMeta,
          latestCommit: mockCommit,
          realtimeToken: 'token-1',
        } as any),
      )
      mockDecryptCommit.execute.mockResolvedValue(Result.ok(new DecryptedCommit('commit-1', [])))

      const result = await loadDocument.executePrivate(nodeMeta)

      expect(mockDecryptCommit.execute).toHaveBeenCalled()
      expect(result.isFailed()).toBe(false)
    })
  })

  describe('executePublic', () => {
    const publicNodeMeta = {
      volumeId: 'volume-1',
      linkId: 'link-1',
    }

    let mockPublicCompat: jest.Mocked<PublicDriveCompat>

    beforeEach(() => {
      mockPublicCompat = {
        permissions: SHARE_URL_PERMISSIONS.EDITOR,
        getDocumentKeys: jest.fn(),
      } as unknown as jest.Mocked<PublicDriveCompat>

      mockCompatWrapper.getCompat.mockReturnValue(mockPublicCompat)
      mockGetNode.execute.mockResolvedValue(
        Result.ok({
          node: { name: 'public-doc', trashed: false },
          fromCache: false,
        } as any),
      )
      mockPublicCompat.getDocumentKeys.mockResolvedValue({ documentContentKey: 'public-key' as any })
      mockLoadMetaAndCommit.execute.mockResolvedValue(
        Result.ok({
          serverBasedMeta: { latestCommitId: () => 'commit-1' },
          latestCommit: undefined,
          realtimeToken: 'token-1',
        } as any),
      )
    })

    it('should successfully load a public document', async () => {
      const result = await loadDocument.executePublic(publicNodeMeta as any, true)

      expect(result.isFailed()).toBe(false)
      expect(result.getValue().documentState).toBeInstanceOf(PublicDocumentState)
    })

    it('should handle public editing permissions', async () => {
      const result = await loadDocument.executePublic(publicNodeMeta as any, true)

      expect(result.getValue().documentState.getProperty('userRole').isPublicEditor()).toBe(true)
    })

    it('should fail if permissions are not loaded', async () => {
      mockPublicCompat.permissions = undefined

      const result = await loadDocument.executePublic(publicNodeMeta as any, true)

      expect(result.isFailed()).toBe(true)
      expect(result.getError()).toBe('Permissions not yet loaded')
    })

    it('should handle failed meta loading', async () => {
      mockLoadMetaAndCommit.execute.mockResolvedValue(Result.fail('Meta loading failed'))

      const result = await loadDocument.executePublic(publicNodeMeta as any, true)

      expect(result.isFailed()).toBe(true)
      expect(result.getError()).toBe('Meta loading failed')
    })
  })
})
