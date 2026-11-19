import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { UnleashClient } from '@proton/unleash/UnleashClient'
import type { DocumentState, PublicDocumentState } from '../State/DocumentState'
import type { GetNode } from '../UseCase/GetNode'
import { PrivateRenameController, PublicRenameController } from './RenameController'
import { renameNode } from '../DriveSDK/renameNode'
import { renamePublicNode } from '../DriveSDK/renamePublicNode'
import { findAvailableNodeName } from '../DriveSDK/findAvailableNodeName'

vi.mock('../DriveSDK/renameNode', () => ({ renameNode: vi.fn() }))
vi.mock('../DriveSDK/renamePublicNode', () => ({ renamePublicNode: vi.fn() }))
vi.mock('../DriveSDK/findAvailableNodeName', () => ({ findAvailableNodeName: vi.fn() }))

const nodeMeta = { volumeId: 'volume-id', linkId: 'link-id' }
const publicNodeMeta = { token: 'token', linkId: 'link-id' }
const parentMeta = { volumeId: 'volume-id', linkId: 'parent-id' }

describe('PublicRenameController', () => {
  const getNode = { updateNodeNameInCache: vi.fn() }
  const logger = { error: vi.fn() }
  const documentState = {
    getProperty: vi.fn().mockReturnValue({ nodeMeta: publicNodeMeta }),
    setProperty: vi.fn(),
  }

  const createController = () =>
    new PublicRenameController(
      documentState as unknown as PublicDocumentState,
      getNode as unknown as GetNode,
      logger as unknown as LoggerInterface,
    )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renames with SDK', async () => {
    const result = await createController().renameDocument('New name')

    expect(result.isFailed()).toBe(false)
    expect(renamePublicNode).toHaveBeenCalledWith(publicNodeMeta, 'New name')
  })

  it('updates document name and node cache on success', async () => {
    await createController().renameDocument('New name')

    expect(documentState.setProperty).toHaveBeenCalledWith('documentName', 'New name')
    expect(getNode.updateNodeNameInCache).toHaveBeenCalledWith(publicNodeMeta, 'New name')
  })

  it('logs and returns failure when rename fails', async () => {
    vi.mocked(renamePublicNode).mockRejectedValueOnce(new Error('Rename failed'))

    const result = await createController().renameDocument('New name')

    expect(result.isFailed()).toBe(true)
    expect(logger.error).toHaveBeenCalled()
    expect(documentState.setProperty).not.toHaveBeenCalled()
    expect(getNode.updateNodeNameInCache).not.toHaveBeenCalled()
  })
})

describe('PrivateRenameController', () => {
  const compat = { findAvailableNodeName: vi.fn() }
  const getNode = { updateNodeNameInCache: vi.fn() }
  const logger = { error: vi.fn() }
  const unleashClient = { isReady: () => true, isEnabled: vi.fn() }
  let decryptedNode: { volumeId: string; parentNodeId?: string }
  const documentState = {
    getProperty: vi.fn((key: string) => (key === 'decryptedNode' ? decryptedNode : { nodeMeta })),
    setProperty: vi.fn(),
  }

  const controller = new PrivateRenameController(
    documentState as unknown as DocumentState,
    compat as unknown as ConstructorParameters<typeof PrivateRenameController>[1],
    getNode as unknown as GetNode,
    logger as unknown as LoggerInterface,
    unleashClient as unknown as UnleashClient,
  )

  beforeEach(() => {
    vi.clearAllMocks()
    decryptedNode = { volumeId: 'volume-id', parentNodeId: 'parent-id' }
    unleashClient.isEnabled.mockReturnValue(true)
    vi.mocked(findAvailableNodeName).mockResolvedValue('New name (1)')
  })

  it('finds available name with SDK when flag is enabled', async () => {
    const result = await controller.renameDocument('New name')

    expect(result.isFailed()).toBe(false)
    expect(findAvailableNodeName).toHaveBeenCalledWith(parentMeta, 'New name')
    expect(compat.findAvailableNodeName).not.toHaveBeenCalled()
    expect(renameNode).toHaveBeenCalledWith(nodeMeta, 'New name (1)')
  })

  it('finds available name with compat when flag is disabled', async () => {
    unleashClient.isEnabled.mockReturnValue(false)
    compat.findAvailableNodeName.mockResolvedValue('New name (2)')

    const result = await controller.renameDocument('New name')

    expect(result.isFailed()).toBe(false)
    expect(compat.findAvailableNodeName).toHaveBeenCalledWith(parentMeta, 'New name')
    expect(findAvailableNodeName).not.toHaveBeenCalled()
    expect(renameNode).toHaveBeenCalledWith(nodeMeta, 'New name (2)')
  })

  it('updates document name and node cache with the available name', async () => {
    await controller.renameDocument('New name')

    expect(documentState.setProperty).toHaveBeenCalledWith('documentName', 'New name (1)')
    expect(getNode.updateNodeNameInCache).toHaveBeenCalledWith(nodeMeta, 'New name (1)')
  })

  it('fails without renaming when document has no parent', async () => {
    decryptedNode = { volumeId: 'volume-id' }

    const result = await controller.renameDocument('New name')

    expect(result.isFailed()).toBe(true)
    expect(logger.error).toHaveBeenCalledWith('Cannot rename document')
    expect(findAvailableNodeName).not.toHaveBeenCalled()
    expect(compat.findAvailableNodeName).not.toHaveBeenCalled()
    expect(renameNode).not.toHaveBeenCalled()
  })

  it('logs and returns failure when finding available name fails', async () => {
    vi.mocked(findAvailableNodeName).mockRejectedValueOnce(new Error('Name lookup failed'))

    const result = await controller.renameDocument('New name')

    expect(result.isFailed()).toBe(true)
    expect(logger.error).toHaveBeenCalled()
    expect(renameNode).not.toHaveBeenCalled()
    expect(documentState.setProperty).not.toHaveBeenCalled()
  })

  it('logs and returns failure when rename fails', async () => {
    vi.mocked(renameNode).mockRejectedValueOnce(new Error('Rename failed'))

    const result = await controller.renameDocument('New name')

    expect(result.isFailed()).toBe(true)
    expect(logger.error).toHaveBeenCalled()
    expect(documentState.setProperty).not.toHaveBeenCalled()
    expect(getNode.updateNodeNameInCache).not.toHaveBeenCalled()
  })
})
