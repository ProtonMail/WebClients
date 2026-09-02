import type { CacheConfig } from '@proton/drive-store/lib/CacheConfig'
import type { IndexedDatabase } from '../../Database/IndexedDB'
import type { SheetsAction, SheetsDatabaseSchema, SheetsPatches } from '../../Database/SheetsDBSchema'
import { SheetsPatchesType, SheetsRecordEncryption } from '../../Database/SheetsDBSchema'
import type { EncryptionService } from '../Encryption/EncryptionService'
import type { EncryptionContext } from '../Encryption/EncryptionContext'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import { getClientKey } from '@proton/shared/lib/authentication/clientKey'
import type { AnyNodeMeta } from '@proton/drive-store/lib/NodeMeta'
import { nodeMetaUniqueId } from '@proton/drive-store/lib/NodeMeta'
import { Result } from '@proton/docs-shared'
import { uint8ArrayToUtf8String } from '@protontech/crypto/utils'
import { CryptoProxy } from '@protontech/crypto'
import type { SessionKey } from '@protontech/crypto'
import type { SheetsActionType } from '@proton/docs-shared/lib/SheetsActionType'
import { v4 as uuidv4 } from 'uuid'

export class SheetsStorageService {
  /**
   * The legacy session client key. Kept only to decrypt records written before the
   * switch to document-scoped keys; all new records are encrypted with the document key.
   */
  private clientKey: Promise<CryptoKey>
  private textEncoder = new TextEncoder()

  constructor(
    private cacheConfig: CacheConfig,
    private encryptionService: EncryptionService<EncryptionContext.LocalStorage>,
    private database: IndexedDatabase<SheetsDatabaseSchema>,
    private logger: LoggerInterface,
  ) {
    this.clientKey = getClientKey(cacheConfig.encryptionKey)
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

  /**
   * A stable, non-reversible fingerprint of the document content key. Stored alongside
   * each document-key record so a reader can cheaply detect records encrypted under a
   * different document key and skip them without attempting a doomed decryption. It is a
   * SHA-256 digest, so it does not leak the key itself.
   */
  private async computeKeyId(documentKey: SessionKey): Promise<string> {
    const digest = await CryptoProxy.computeHash({
      algorithm: 'SHA256',
      data: documentKey.data as Uint8Array<ArrayBuffer>,
    })
    return digest.toBase64()
  }

  /**
   * Decrypt a record's payload using the scheme it was written with: the document content
   * key for new records, or the legacy session client key for older ones.
   */
  private async decryptRecordPayload(
    encryptedBytes: Uint8Array<ArrayBuffer>,
    encryption: SheetsRecordEncryption,
    documentKey: SessionKey,
  ): Promise<Result<Uint8Array<ArrayBuffer>>> {
    if (encryption === SheetsRecordEncryption.DocumentKey) {
      const result = await this.encryptionService.decryptData(encryptedBytes, this.cacheConfig.namespace, documentKey)
      if (result.isFailed()) {
        return Result.fail(result.getError())
      }
      return Result.ok(result.getValue().content as Uint8Array<ArrayBuffer>)
    }

    // Legacy client-key records.
    const clientKey = await this.clientKey
    return this.encryptionService.decryptDataForLocalStorage(encryptedBytes, this.cacheConfig.namespace, clientKey)
  }

  async savePatches(dto: {
    document: AnyNodeMeta | undefined
    documentKey: SessionKey
    patches: object
    timestamp: number
    updateHash?: string
    type: SheetsPatchesType
  }): Promise<Result<void>> {
    try {
      const nodeKey = this.buildKey(dto.document, 'nodeKey')

      const stringifiedPatches = JSON.stringify(dto.patches)
      const uint8ArrayPatches = this.textEncoder.encode(stringifiedPatches)
      const encryptedPatches = await this.encryptionService.encryptAnonymousData(
        uint8ArrayPatches,
        this.cacheConfig.namespace,
        dto.documentKey,
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
        encryption: SheetsRecordEncryption.DocumentKey,
        keyId: await this.computeKeyId(dto.documentKey),
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
    documentKey: SessionKey
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
      const currentKeyId = await this.computeKeyId(dto.documentKey)
      // Patches are replayed in order: the Base snapshot, then deltas on top of it. If any
      // record can't be used (encrypted under a different/rotated key, or otherwise
      // undecryptable) the sequence has a gap, and replaying what's left would reconstruct
      // a state that never existed. Rather than risk silent corruption we invalidate the
      // whole node's cache and fall back to a fresh server load.
      let cacheInvalid = false

      for (const patch of patches.getValue()) {
        const encryption = patch.encryption ?? SheetsRecordEncryption.ClientKey

        // Cheap check for document-key records: a record stamped with a different key
        // fingerprint will never decrypt under the current document key.
        if (
          encryption === SheetsRecordEncryption.DocumentKey &&
          patch.keyId !== undefined &&
          patch.keyId !== currentKeyId
        ) {
          this.logger.warn(
            `[SheetsStorageService] Patch encrypted under a different document key (type ${patch.type}, timestamp ${patch.timestamp}); invalidating patch cache for node`,
          )
          cacheInvalid = true
          break
        }

        const decryptedPatches = await this.decryptRecordPayload(patch.patches, encryption, dto.documentKey)
        if (decryptedPatches.isFailed()) {
          this.logger.warn(
            `[SheetsStorageService] Undecryptable patch (type ${patch.type}, timestamp ${patch.timestamp}); invalidating patch cache for node: ${decryptedPatches.getError()}`,
          )
          cacheInvalid = true
          break
        }
        const decryptedPatchesString = uint8ArrayToUtf8String(decryptedPatches.getValue())
        decryptedPatchesArray.push({
          patches: JSON.parse(decryptedPatchesString),
          timestamp: patch.timestamp,
          updateHash: patch.updateHash,
          type: patch.type,
        })
      }

      if (cacheInvalid) {
        // The cached sequence is incomplete, so clear the node's entire patch cache. The
        // caller falls back to a fresh server load and a new Base patch is written on the
        // next change.
        this.logger.warn(
          `[SheetsStorageService] Patch cache is incomplete; clearing it for node so it rebuilds from the server`,
        )
        const removeResult = await this.removePatches({ document: dto.document })
        if (removeResult.isFailed()) {
          this.logger.error(`[SheetsStorageService] Failed to clear invalid patch cache: ${removeResult.getError()}`)
        }
        return Result.ok([])
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
    documentKey: SessionKey
    type: SheetsActionType
    content: unknown
    timestamp: number
  }): Promise<Result<void>> {
    try {
      const nodeKey = this.buildKey(dto.document, 'nodeKey')

      const stringifiedContent = JSON.stringify(dto.content)
      const uint8ArrayContent = this.textEncoder.encode(stringifiedContent)
      const encryptedContent = await this.encryptionService.encryptAnonymousData(
        uint8ArrayContent,
        this.cacheConfig.namespace,
        dto.documentKey,
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
        encryption: SheetsRecordEncryption.DocumentKey,
        keyId: await this.computeKeyId(dto.documentKey),
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
    documentKey: SessionKey
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
      const currentKeyId = await this.computeKeyId(dto.documentKey)
      // Actions encrypted under a different/rotated key can no longer be decrypted; drop
      // them instead of failing the whole read, and prune them so they don't recur.
      const unusableIds: number[] = []

      for (const record of recordsResult.getValue()) {
        const encryption = record.encryption ?? SheetsRecordEncryption.ClientKey

        if (
          encryption === SheetsRecordEncryption.DocumentKey &&
          record.keyId !== undefined &&
          record.keyId !== currentKeyId
        ) {
          this.logger.warn(
            `[SheetsStorageService] Discarding action encrypted under a different document key (type ${record.type}, timestamp ${record.timestamp})`,
          )
          if (record.id !== undefined) {
            unusableIds.push(record.id)
          }
          continue
        }

        const decryptedContent = await this.decryptRecordPayload(record.content, encryption, dto.documentKey)
        if (decryptedContent.isFailed()) {
          this.logger.warn(
            `[SheetsStorageService] Skipping undecryptable action (type ${record.type}, timestamp ${record.timestamp}): ${decryptedContent.getError()}`,
          )
          if (record.id !== undefined) {
            unusableIds.push(record.id)
          }
          continue
        }

        try {
          const decryptedContentString = uint8ArrayToUtf8String(decryptedContent.getValue())
          decryptedActionsArray.push({
            type: record.type,
            content: JSON.parse(decryptedContentString),
            timestamp: record.timestamp,
          })
        } catch (error) {
          this.logger.error('[SheetsStorageService] Failed to parse action content', error as Error)
          if (record.id !== undefined) {
            unusableIds.push(record.id)
          }
        }
      }

      if (unusableIds.length > 0) {
        const deleteResult = await this.database.deleteRecords('actions', unusableIds)
        if (deleteResult.isFailed()) {
          this.logger.error(`[SheetsStorageService] Failed to prune unusable actions: ${deleteResult.getError()}`)
        }
      }

      return Result.ok(decryptedActionsArray)
    } catch (error) {
      this.logger.error(`[SheetsStorageService] Failed to get decrypted actions: ${error}`)
      return Result.fail(`Failed to get decrypted actions: ${error}`)
    }
  }
}
