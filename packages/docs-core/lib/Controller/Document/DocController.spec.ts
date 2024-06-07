import { DriveCompat, NodeMeta } from '@proton/drive-store'
import { DocController } from './DocController'
import { UserService } from '../../Services/User/UserService'
import { SquashDocument } from '../../UseCase/SquashDocument'
import { DebugCreateInitialCommit } from '../../UseCase/CreateInitialCommit'
import { LoadDocument } from '../../UseCase/LoadDocument'
import { DecryptMessage } from '../../UseCase/DecryptMessage'
import { DuplicateDocument } from '../../UseCase/DuplicateDocument'
import { CreateNewDocument } from '../../UseCase/CreateNewDocument'
import { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import { WebsocketServiceInterface } from '../../Services/Websockets/WebsocketServiceInterface'
import { ClientRequiresEditorMethods, InternalEventBusInterface } from '@proton/docs-shared'
import { LoggerInterface } from '@standardnotes/utils'
import { Result } from '@standardnotes/domain-core'

describe('DocController', () => {
  let controller: DocController

  beforeEach(() => {
    controller = new DocController(
      {} as NodeMeta,
      {
        user: { Email: 'foo@bar.com' },
      } as jest.Mocked<UserService>,
      {} as jest.Mocked<DriveCompat>,
      {} as jest.Mocked<SquashDocument>,
      {} as jest.Mocked<DebugCreateInitialCommit>,
      {} as jest.Mocked<LoadDocument>,
      {
        execute: jest.fn().mockReturnValue(Result.ok({ content: '' })),
      } as unknown as jest.Mocked<DecryptMessage>,
      {} as jest.Mocked<DuplicateDocument>,
      {} as jest.Mocked<CreateNewDocument>,
      {} as jest.Mocked<GetDocumentMeta>,
      {} as jest.Mocked<WebsocketServiceInterface>,
      {
        addEventHandler: jest.fn(),
        publish: jest.fn(),
      } as unknown as jest.Mocked<InternalEventBusInterface>,
      {
        debug: jest.fn(),
      } as unknown as jest.Mocked<LoggerInterface>,
    )

    controller.editorInvoker = {
      receiveMessage: jest.fn(),
      showEditor: jest.fn(),
    } as unknown as jest.Mocked<ClientRequiresEditorMethods>
  })

  describe('handleCompletingInitialSyncWithRts', () => {
    it('should show editor', () => {
      controller.handleCompletingInitialSyncWithRts()

      expect(controller.editorInvoker!.showEditor).toHaveBeenCalled()
    })
  })
})
