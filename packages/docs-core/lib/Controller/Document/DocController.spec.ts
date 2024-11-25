import { ConnectionCloseReason } from '@proton/docs-proto'
import type { DocumentMetaInterface, InternalEventBusInterface } from '@proton/docs-shared'
import { DocumentRole } from '@proton/docs-shared'
import type { DecryptedNode, DriveCompat, NodeMeta } from '@proton/drive-store'
import type { LoggerInterface } from '@proton/utils/logs'
import { Result } from '../../Domain/Result/Result'
import type { DocumentEntitlements } from '../../Types/DocumentEntitlements'
import type { CreateNewDocument } from '../../UseCase/CreateNewDocument'
import type { DuplicateDocument } from '../../UseCase/DuplicateDocument'
import type { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import type { LoadCommit } from '../../UseCase/LoadCommit'
import type { SeedInitialCommit } from '../../UseCase/SeedInitialCommit'
import type { SquashDocument } from '../../UseCase/SquashDocument'
import { DocController } from './DocController'
import { DocControllerEvent } from './DocControllerEvent'
import { DocumentMeta } from '../../Models/DocumentMeta'
import type { GetNode } from '../../UseCase/GetNode'
import type { DocumentStateValues } from '../../State/DocumentState'
import { DocumentState } from '../../State/DocumentState'

describe('DocController', () => {
  let controller: DocController
  let driveCompat = {
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
        nodeMeta: {} as NodeMeta,
        latestCommitId: () => '123',
      } as unknown as DocumentMetaInterface,
      entitlements: { keys: {}, role: new DocumentRole('Editor') } as unknown as DocumentEntitlements,
      decryptedNode: {} as DecryptedNode,
    } as DocumentStateValues)

    controller = new DocController(
      documentState,
      driveCompat as unknown as jest.Mocked<DriveCompat>,
      {} as jest.Mocked<SquashDocument>,
      {} as jest.Mocked<SeedInitialCommit>,
      {
        execute: jest.fn().mockReturnValue(
          Result.ok({
            numberOfUpdates: jest.fn(),
            squashedRepresentation: jest.fn().mockReturnValue(new Uint8Array(0)),
            needsSquash: jest.fn().mockReturnValue(false),
            byteSize: 0,
          }),
        ),
      } as unknown as jest.Mocked<LoadCommit>,
      {} as jest.Mocked<DuplicateDocument>,
      {} as jest.Mocked<CreateNewDocument>,
      {
        execute: jest.fn().mockReturnValue(
          Result.ok({
            latestCommitId: jest.fn().mockReturnValue('123'),
          }),
        ),
      } as unknown as jest.Mocked<GetDocumentMeta>,
      {
        execute: jest.fn().mockReturnValue(Result.ok({})),
      } as unknown as jest.Mocked<GetNode>,
      {
        addEventHandler: jest.fn(),
        publish: jest.fn(),
      } as unknown as jest.Mocked<InternalEventBusInterface>,
      {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: console.error,
      } as unknown as jest.Mocked<LoggerInterface>,
    )
  })

  describe('handle realtime disconnection', () => {
    it('should refetch commit if disconnect reason is stale commit id', () => {
      controller.refetchCommitDueToStaleContents = jest.fn()

      controller.handleRealtimeDisconnection(
        ConnectionCloseReason.create({ code: ConnectionCloseReason.CODES.STALE_COMMIT_ID }),
      )

      expect(controller.refetchCommitDueToStaleContents).toHaveBeenCalled()
    })
  })

  describe('handleCommitIdOutOfSyncEvent', () => {
    it('should refetch commit', () => {
      controller.refetchCommitDueToStaleContents = jest.fn()

      controller.handleRealtimeFailedToGetToken('due-to-commit-id-out-of-sync')

      expect(controller.refetchCommitDueToStaleContents).toHaveBeenCalled()
    })
  })

  describe('refetchCommitDueToStaleContents', () => {
    it('should post UnableToResolveCommitIdConflict error if unable to resolve', async () => {
      controller.logger.error = jest.fn()

      controller._loadCommit.execute = jest.fn().mockReturnValue(Result.fail('Unable to resolve'))
      controller._getDocumentMeta.execute = jest.fn().mockReturnValue(Result.fail('Unable to resolve'))

      await controller.refetchCommitDueToStaleContents('rts-disconnect')

      expect(controller.eventBus.publish).toHaveBeenCalledWith({
        type: DocControllerEvent.UnableToResolveCommitIdConflict,
        payload: undefined,
      })
    })

    it('should not reprocess if already processing', async () => {
      controller._loadCommit.execute = jest.fn().mockReturnValue(
        Result.ok({
          numberOfUpdates: jest.fn(),
          squashedRepresentation: jest.fn().mockReturnValue(new Uint8Array()),
          needsSquash: jest.fn().mockReturnValue(false),
        }),
      )
      controller._getDocumentMeta.execute = jest.fn().mockReturnValue(Result.ok({}))

      controller.isRefetchingStaleCommit = true

      await controller.refetchCommitDueToStaleContents('rts-disconnect')

      expect(controller._loadCommit.execute).not.toHaveBeenCalled()
    })

    it('should re-set the initial commit if commit is successfully resolved', async () => {
      controller._loadCommit.execute = jest.fn().mockReturnValue(
        Result.ok({
          numberOfUpdates: jest.fn().mockReturnValue(0),
          needsSquash: jest.fn().mockReturnValue(false),
          squashedRepresentation: jest.fn().mockReturnValue(new Uint8Array()),
        }),
      )

      documentState.setProperty = jest.fn()

      await controller.refetchCommitDueToStaleContents('rts-disconnect')

      expect(documentState.setProperty).toHaveBeenCalledWith('baseCommit', expect.anything())
    })
  })

  describe('handleEditorProvidingInitialConversionContent', () => {
    beforeEach(() => {
      controller.createInitialCommit = jest.fn().mockReturnValue(Result.ok({ commitId: '123' }))
    })

    it('should create initial commit', async () => {
      await controller.handleEditorProvidingInitialConversionContent(new Uint8Array())

      expect(controller.createInitialCommit).toHaveBeenCalled()
    })
  })

  describe('trashDocument', () => {
    beforeEach(() => {
      documentState.setProperty(
        'documentMeta',
        new DocumentMeta({ linkId: 'abc', volumeId: 'def' }, ['ghi'], 123, 456, 'jkl'),
      )

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
      documentState.setProperty(
        'documentMeta',
        new DocumentMeta({ linkId: 'abc', volumeId: 'def' }, ['ghi'], 123, 456, 'jkl'),
      )

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
      documentState.setProperty(
        'documentMeta',
        new DocumentMeta({ linkId: 'abc', volumeId: 'def' }, ['ghi'], 123, 456, 'jkl'),
      )

      controller._getNode.execute = jest
        .fn()
        .mockResolvedValueOnce(Result.ok({ node: { parentNodeId: 123, trashed: null } }))

      await controller.refreshNodeAndDocMeta({ imposeTrashState: undefined })
      expect(documentState.getProperty('documentTrashState')).toBe('not_trashed')
    })

    it('trashed state will be not_trashed if DecryptedNode trashed property is omitted', async () => {
      documentState.setProperty(
        'documentMeta',
        new DocumentMeta({ linkId: 'abc', volumeId: 'def' }, ['ghi'], 123, 456, 'jkl'),
      )

      controller._getNode.execute = jest.fn().mockResolvedValueOnce(Result.ok({ node: { parentNodeId: 123 } }))

      await controller.refreshNodeAndDocMeta({ imposeTrashState: undefined })
      expect(documentState.getProperty('documentTrashState')).toBe('not_trashed')
    })

    it('trashed state will be trashed if DecryptedNode trashed property is populated', async () => {
      documentState.setProperty(
        'documentMeta',
        new DocumentMeta({ linkId: 'abc', volumeId: 'def' }, ['ghi'], 123, 456, 'jkl'),
      )

      controller._getNode.execute = jest
        .fn()
        .mockResolvedValueOnce(Result.ok({ node: { parentNodeId: 123, trashed: 123 } }))

      await controller.refreshNodeAndDocMeta({ imposeTrashState: undefined })
      expect(documentState.getProperty('documentTrashState')).toBe('trashed')
    })
  })
})
