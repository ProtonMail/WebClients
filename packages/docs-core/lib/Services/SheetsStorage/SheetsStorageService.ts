import type { CacheConfig } from '@proton/drive-store/lib/CacheConfig'
import type { IndexedDatabase } from '../../Database/IndexedDB'
import type { SheetsAction, SheetsDatabaseSchema, SheetsPatches } from '../../Database/SheetsDBSchema'
import { SheetsPatchesType } from '../../Database/SheetsDBSchema'
import type { EncryptionService } from '../Encryption/EncryptionService'
import type { EncryptionContext } from '../Encryption/EncryptionContext'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import { getClientKey } from '@proton/shared/lib/authentication/clientKey'
import type { AnyNodeMeta } from '@proton/drive-store/lib/NodeMeta'
import { nodeMetaUniqueId } from '@proton/drive-store/lib/NodeMeta'
import { Result } from '@proton/docs-shared'
import { uint8ArrayToUtf8String } from '@protontech/crypto/utils'
import type { SheetsActionType } from '@proton/docs-shared/lib/SheetsActionType'
import { v4 as uuidv4 } from 'uuid'

export class SheetsStorageService {
  private encryptionKey: Promise<CryptoKey>
  private textEncoder = new TextEncoder()

  constructor(
    private cacheConfig: CacheConfig,
    private encryptionService: EncryptionService<EncryptionContext.LocalStorage>,
    private database: IndexedDatabase<SheetsDatabaseSchema>,
    private logger: LoggerInterface,
  ) {
    this.encryptionKey = getClientKey(cacheConfig.encryptionKey)
  }

  buildKey(document: AnyNodeMeta | undefined, key: string) {
    if (document) {
      return `sheets.${this.cacheConfig.namespace}.${nodeMetaUniqueId(document)}.${key}`
    } else {
      return `sheets.${this.cacheConfig.namespace}.${key}`
    }
  }

  getBrowserId(): string {
    const persisted = localStorage.getItem('sheets.browserId')
    if (persisted) {
      return persisted
    }
    const browserId = uuidv4()
    localStorage.setItem('sheets.browserId', browserId)
    return browserId
  }

  async savePatches(dto: {
    document: AnyNodeMeta | undefined
    patches: object
    timestamp: number
    updateHash?: string
    type: SheetsPatchesType
  }): Promise<Result<void>> {
    try {
      const nodeKey = this.buildKey(dto.document, 'nodeKey')

      const encryptionKey = await this.encryptionKey

      const stringifiedPatches = JSON.stringify(dto.patches)
      const uint8ArrayPatches = this.textEncoder.encode(stringifiedPatches)
      const encryptedPatches = await this.encryptionService.encryptDataForLocalStorage(
        uint8ArrayPatches,
        this.cacheConfig.namespace,
        encryptionKey,
      )
      if (encryptedPatches.isFailed()) {
        return Result.fail(encryptedPatches.getError())
      }

      const patches: SheetsPatches = {
        nodeKey,
        timestamp: dto.timestamp,
        patches: encryptedPatches.getValue(),
        updateHash: dto.updateHash,
        type: dto.type,
        browserId: this.getBrowserId(),
      }

      const result = await this.database.saveRecords('patches', [patches])
      if (result.isFailed()) {
        return Result.fail(result.getError())
      }

      return Result.ok()
    } catch (error) {
      this.logger.error(`[SheetsStorageService] Failed to save patches: ${error}`)
      return Result.fail(`Failed to save patches: ${error}`)
    }
  }

  async getEncryptedPatches(dto: { document: AnyNodeMeta | undefined }): Promise<Result<SheetsPatches[]>> {
    try {
      const nodeKey = this.buildKey(dto.document, 'nodeKey')
      const result = await this.database.getRecordsByIndex('patches', 'nodeKey', nodeKey)
      if (result.isFailed()) {
        return Result.fail(result.getError())
      }
      return Result.ok(result.getValue())
    } catch (error) {
      this.logger.error(`[SheetsStorageService] Failed to get encrypted patches: ${error}`)
      return Result.fail(`Failed to get encrypted patches: ${error}`)
    }
  }

  async hasBasePatches(dto: { document: AnyNodeMeta | undefined }): Promise<Result<boolean>> {
    try {
      const patches = await this.getEncryptedPatches({ document: dto.document })
      if (patches.isFailed()) {
        return Result.fail(patches.getError())
      }
      return Result.ok(patches.getValue().some((patch) => patch.type === SheetsPatchesType.Base))
    } catch (error) {
      this.logger.error(`[SheetsStorageService] Failed to check if patches exist: ${error}`)
      return Result.fail(`Failed to check if patches exist: ${error}`)
    }
  }

  async getDecryptedPatches(dto: {
    document: AnyNodeMeta | undefined
  }): Promise<Result<{ patches: object; timestamp: number; updateHash?: string; type: SheetsPatchesType }[]>> {
    try {
      const patches = await this.getEncryptedPatches({ document: dto.document })
      if (patches.isFailed()) {
        return Result.fail(patches.getError())
      }
      const decryptedPatchesArray: {
        patches: object
        timestamp: number
        updateHash?: string
        type: SheetsPatchesType
      }[] = []
      const encryptionKey = await this.encryptionKey
      for (const patch of patches.getValue()) {
        const decryptedPatches = await this.encryptionService.decryptDataForLocalStorage(
          patch.patches,
          this.cacheConfig.namespace,
          encryptionKey,
        )
        if (decryptedPatches.isFailed()) {
          return Result.fail(decryptedPatches.getError())
        }
        const decryptedPatchesString = uint8ArrayToUtf8String(decryptedPatches.getValue())
        decryptedPatchesArray.push({
          patches: JSON.parse(decryptedPatchesString),
          timestamp: patch.timestamp,
          updateHash: patch.updateHash,
          type: patch.type,
        })
      }

      return Result.ok(decryptedPatchesArray)
    } catch (error) {
      this.logger.error(`[SheetsStorageService] Failed to get patches: ${error}`)
      return Result.fail(`Failed to get patches: ${error}`)
    }
  }

  async removePatches(dto: { document: AnyNodeMeta | undefined }): Promise<Result<void>> {
    try {
      const nodeKey = this.buildKey(dto.document, 'nodeKey')
      const result = await this.database.deleteRecordsByIndex('patches', 'nodeKey', nodeKey)
      if (result.isFailed()) {
        return Result.fail(result.getError())
      }
      return Result.ok()
    } catch (error) {
      this.logger.error(`[SheetsStorageService] Failed to remove patches: ${error}`)
      return Result.fail(`Failed to remove patches: ${error}`)
    }
  }

  async saveAction(dto: {
    document: AnyNodeMeta | undefined
    type: SheetsActionType
    content: unknown
    timestamp: number
  }): Promise<Result<void>> {
    try {
      const nodeKey = this.buildKey(dto.document, 'nodeKey')
      const encryptionKey = await this.encryptionKey

      const stringifiedContent = JSON.stringify(dto.content)
      const uint8ArrayContent = this.textEncoder.encode(stringifiedContent)
      const encryptedContent = await this.encryptionService.encryptDataForLocalStorage(
        uint8ArrayContent,
        this.cacheConfig.namespace,
        encryptionKey,
      )
      if (encryptedContent.isFailed()) {
        return Result.fail(encryptedContent.getError())
      }

      const action: SheetsAction = {
        nodeKey,
        timestamp: dto.timestamp,
        type: dto.type,
        content: encryptedContent.getValue(),
        browserId: this.getBrowserId(),
      }
      const result = await this.database.saveRecords('actions', [action])
      if (result.isFailed()) {
        return Result.fail(result.getError())
      }
      return Result.ok()
    } catch (error) {
      this.logger.error(`[SheetsStorageService] Failed to save action: ${error}`)
      return Result.fail(`Failed to save action: ${error}`)
    }
  }

  async getDecryptedActions(dto: {
    document: AnyNodeMeta | undefined
  }): Promise<Result<{ type: SheetsActionType; content: unknown; timestamp: number }[]>> {
    try {
      const nodeKey = this.buildKey(dto.document, 'nodeKey')
      const recordsResult = await this.database.getRecordsByIndex('actions', 'nodeKey', nodeKey)
      if (recordsResult.isFailed()) {
        return Result.fail(recordsResult.getError())
      }
      const decryptedActionsArray: {
        type: SheetsActionType
        content: unknown
        timestamp: number
      }[] = []
      const encryptionKey = await this.encryptionKey
      for (const record of recordsResult.getValue()) {
        const decryptedContent = await this.encryptionService.decryptDataForLocalStorage(
          record.content,
          this.cacheConfig.namespace,
          encryptionKey,
        )
        let content: unknown = {}
        if (!decryptedContent.isFailed()) {
          try {
            const decryptedContentString = uint8ArrayToUtf8String(decryptedContent.getValue())
            content = JSON.parse(decryptedContentString)
          } catch (error) {
            this.logger.error('[SheetsStorageService] Failed to parse content', error as Error)
          }
        } else {
          this.logger.error('[SheetsStorageService] Failed to decrypt content', decryptedContent.getError())
        }
        decryptedActionsArray.push({ type: record.type, content, timestamp: record.timestamp })
      }
      return Result.ok(decryptedActionsArray)
    } catch (error) {
      this.logger.error(`[SheetsStorageService] Failed to get decrypted actions: ${error}`)
      return Result.fail(`Failed to get decrypted actions: ${error}`)
    }
  }
}
