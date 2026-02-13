import type { DocumentMetaInterface, InternalEventBusInterface } from '@proton/docs-shared'
import { DocumentRole, Result } from '@proton/docs-shared'
import type { DecryptedNode, DriveCompat } from '@proton/drive-store'
import type { LoggerInterface } from '@proton/utils/logs'
import type { DocumentEntitlements } from '../Types/DocumentEntitlements'
import type { CreateNewDocument } from '../UseCase/CreateNewDocument'
import type { DuplicateDocument } from '../UseCase/DuplicateDocument'
import type { SeedInitialCommit } from '../UseCase/SeedInitialCommit'
import type { SquashDocument } from '../UseCase/SquashDocument'
import { AuthenticatedDocController } from './AuthenticatedDocController'
import { DocumentMeta } from '../Models/DocumentMeta'
import type { GetNode } from '../UseCase/GetNode'
import type { DocumentStateValues } from '../State/DocumentState'
import { DocumentState } from '../State/DocumentState'
import { DocumentUpdate } from '@proton/docs-proto'

describe('AuthenticatedDocController', () => {
  let controller: AuthenticatedDocController
  const driveCompat = {
    getNode: jest.fn(),
    trashDocument: jest.fn(),
    restoreDocument: jest.fn(),
    getShareId: jest.fn(),
  }
  let documentState: DocumentState

  beforeEach(async () => {
    documentState = new DocumentState({
      ...DocumentState.defaults,
      documentMeta: {
        latestCommitId: () => '123',
      } as unknown as DocumentMetaInterface,
      entitlements: { keys: {}, role: new DocumentRole('Editor') } as unknown as DocumentEntitlements,
      decryptedNode: {} as DecryptedNode,
    } as DocumentStateValues)

    controller = new AuthenticatedDocController(
      documentState,
      driveCompat as unknown as jest.Mocked<DriveCompat>,
      {} as jest.Mocked<SquashDocument>,
      {} as jest.Mocked<SeedInitialCommit>,
      {} as jest.Mocked<DuplicateDocument>,
      {} as jest.Mocked<CreateNewDocument>,
      {
        execute: jest.fn().mockReturnValue(Result.ok({ node: {} })),
      } as unknown as jest.Mocked<GetNode>,
      {
        addEventHandler: jest.fn(),
        addEventCallback: jest.fn(),
        publish: jest.fn(),
      } as unknown as jest.Mocked<InternalEventBusInterface>,
      {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: console.error,
      } as unknown as jest.Mocked<LoggerInterface>,
      'doc',
    )
  })

  describe('handleEditorProvidingInitialConversionContent', () => {
    beforeEach(() => {
      controller.createInitialCommit = jest.fn().mockReturnValue(Result.ok({ commitId: '123' }))
    })

    it('should create initial commit', async () => {
      await controller.handleEditorProvidingInitialConversionContent(new DocumentUpdate())

      expect(controller.createInitialCommit).toHaveBeenCalled()
    })
  })

  describe('trashDocument', () => {
    beforeEach(() => {
      documentState.setProperty('documentMeta', new DocumentMeta('volume-id-def', ['ghi'], 123, 456))

      documentState.setProperty('decryptedNode', { parentNodeId: '123', trashed: true } as unknown as DecryptedNode)

      documentState.setProperty('documentTrashState', 'not_trashed')
    })

    it('trashState should be trashing initially', () => {
      const promise = controller.trashDocument()
      expect(documentState.getProperty('documentTrashState')).toBe('trashing')
      return promise
    })

    it('trashState should be trashed when complete', async () => {
      await controller.trashDocument()
      expect(documentState.getProperty('documentTrashState')).toBe('trashed')
    })

    it('should refreshNodeAndDocMeta', async () => {
      const refreshNodeAndDocMeta = jest.spyOn(controller, 'refreshNodeAndDocMeta')

      await controller.trashDocument()
      expect(refreshNodeAndDocMeta).toHaveBeenCalled()
    })

    it('should set didTrashDocInCurrentSession to true', async () => {
      expect(controller.didTrashDocInCurrentSession).toBe(false)

      await controller.trashDocument()

      expect(controller.didTrashDocInCurrentSession).toBe(true)
    })
  })

  describe('restoreDocument', () => {
    beforeEach(() => {
      documentState.setProperty('documentMeta', new DocumentMeta('volume-id-def', ['ghi'], 123, 456))

      documentState.setProperty('decryptedNode', { parentNodeId: '123', trashed: true } as unknown as DecryptedNode)

      documentState.setProperty('documentTrashState', 'trashed')
    })

    it('trashState should be restoring initially', () => {
      const promise = controller.restoreDocument()
      expect(documentState.getProperty('documentTrashState')).toBe('restoring')
      return promise
    })

    it('trashState should be restored when complete', async () => {
      controller._getNode.execute = jest
        .fn()
        .mockResolvedValue(Result.ok({ node: { parentNodeId: '123', trashed: false } }))
      await controller.restoreDocument()
      expect(documentState.getProperty('documentTrashState')).toBe('not_trashed')
    })

    it('should refreshNodeAndDocMeta', async () => {
      const refreshNodeAndDocMeta = jest.spyOn(controller, 'refreshNodeAndDocMeta')

      await controller.restoreDocument()
      expect(refreshNodeAndDocMeta).toHaveBeenCalled()
    })
  })

  describe('refreshNodeAndDocMeta', () => {
    it('trashed state will be not_trashed if DecryptedNode trashed property is null', async () => {
      documentState.setProperty('documentMeta', new DocumentMeta('volume-id-def', ['ghi'], 123, 456))

      controller._getNode.execute = jest
        .fn()
        .mockResolvedValueOnce(Result.ok({ node: { parentNodeId: 123, trashed: null } }))

      await controller.refreshNodeAndDocMeta({ imposeTrashState: undefined })
      expect(documentState.getProperty('documentTrashState')).toBe('not_trashed')
    })

    it('trashed state will be not_trashed if DecryptedNode trashed property is omitted', async () => {
      documentState.setProperty('documentMeta', new DocumentMeta('volume-id-def', ['ghi'], 123, 456))

      controller._getNode.execute = jest.fn().mockResolvedValueOnce(Result.ok({ node: { parentNodeId: 123 } }))

      await controller.refreshNodeAndDocMeta({ imposeTrashState: undefined })
      expect(documentState.getProperty('documentTrashState')).toBe('not_trashed')
    })

    it('trashed state will be trashed if DecryptedNode trashed property is populated', async () => {
      documentState.setProperty('documentMeta', new DocumentMeta('volume-id-def', ['ghi'], 123, 456))

      controller._getNode.execute = jest
        .fn()
        .mockResolvedValueOnce(Result.ok({ node: { parentNodeId: 123, trashed: 123 } }))

      await controller.refreshNodeAndDocMeta({ imposeTrashState: undefined })
      expect(documentState.getProperty('documentTrashState')).toBe('trashed')
    })
  })
})
