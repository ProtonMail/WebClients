import { getClientKey } from '@proton/shared/lib/authentication/clientKey'
import { uint8ArrayToBase64String, base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding'
import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store/lib'
import { nodeMetaUniqueId, type AnyNodeMeta } from '@proton/drive-store/lib'
import type { CacheConfig } from '@proton/drive-store/lib/CacheConfig'
import type { EncryptionContext } from './Encryption/EncryptionContext'
import type { EncryptionService } from './Encryption/EncryptionService'
import type { LoggerInterface } from '@proton/utils/logs'
import { Result } from '@proton/docs-shared'
import type { DatabaseSchema } from '../Database/Schema'
import type { IndexedDatabase } from '../Database/IndexedDB'
import { Commit } from '@proton/docs-proto'
import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils'

type CachedValue = {
  encryptedValue: string
  expirationTime?: number
}

type DocumentIdentifier = Pick<PublicNodeMeta, 'token'> | NodeMeta

/**
 * The cache service is only usable in private user contexts and not available for public contexts.
 */
export class CacheService {
  private encryptionKey: Promise<CryptoKey>

  constructor(
    private cacheConfig: CacheConfig,
    private database: IndexedDatabase<DatabaseSchema>,
    private encryptionService: EncryptionService<EncryptionContext.LocalStorage>,
    private logger: LoggerInterface,
  ) {
    this.encryptionKey = getClientKey(cacheConfig.encryptionKey)
  }

  buildKey(document: AnyNodeMeta | undefined, key: string) {
    if (document) {
      return `cache.${this.cacheConfig.namespace}.${nodeMetaUniqueId(document)}.${key}`
    } else {
      return `cache.${this.cacheConfig.namespace}.${key}`
    }
  }

  async cacheValue(dto: {
    document: AnyNodeMeta | undefined
    key: string
    value: string
    expirationTime?: number
  }): Promise<Result<void>> {
    try {
      const key = await this.encryptionKey

      const encryptedValue = await this.encryptionService.encryptDataForLocalStorage(
        stringToUtf8Array(dto.value),
        this.cacheConfig.namespace,
        key,
      )
      if (encryptedValue.isFailed()) {
        return Result.fail(encryptedValue.getError())
      }

      const cacheValue: CachedValue = {
        encryptedValue: uint8ArrayToBase64String(encryptedValue.getValue()),
        expirationTime: dto.expirationTime,
      }

      localStorage.setItem(this.buildKey(dto.document, dto.key), JSON.stringify(cacheValue))
      return Result.ok()
    } catch (error) {
      this.logger.error(`[CacheService] Failed to cache value for key ${dto.key}: ${error}`)
      return Result.fail(`Failed to cache value for key ${dto.key}: ${error}`)
    }
  }

  async getCachedValue(dto: { document: AnyNodeMeta | undefined; key: string }): Promise<Result<string | undefined>> {
    try {
      const cachedValue = localStorage.getItem(this.buildKey(dto.document, dto.key))
      if (!cachedValue) {
        this.logger.info(`[CacheService] ❌ No cached value for key ${dto.key}`)
        return Result.ok(undefined)
      }

      const { encryptedValue, expirationTime } = JSON.parse(cachedValue) as CachedValue

      if (expirationTime && expirationTime < Date.now()) {
        this.logger.info(`[CacheService] ❌ Expired cache value for key ${dto.key}`)
        localStorage.removeItem(this.buildKey(dto.document, dto.key))
        return Result.ok(undefined)
      }

      const key = await this.encryptionKey

      const decryptedValue = await this.encryptionService.decryptDataForLocalStorage(
        base64StringToUint8Array(encryptedValue),
        this.cacheConfig.namespace,
        key,
      )
      if (decryptedValue.isFailed()) {
        return Result.fail(decryptedValue.getError())
      }

      this.logger.info(`[CacheService] ✅ Loaded cached value for key ${dto.key}`)
      return Result.ok(utf8ArrayToString(decryptedValue.getValue()))
    } catch (error) {
      this.logger.error(`[CacheService] Failed to load cached value for key ${dto.key}: ${error}`)
      return Result.fail(`Failed to load cached value for key ${dto.key}: ${error}`)
    }
  }

  async cacheCommit(dto: { commitId: string; commit: Commit; expirationTime?: number }): Promise<Result<void>> {
    try {
      const key = await this.encryptionKey

      const encryptedValue = await this.encryptionService.encryptDataForLocalStorage(
        dto.commit.serializeBinary() as Uint8Array<ArrayBuffer>,
        this.cacheConfig.namespace,
        key,
      )
      if (encryptedValue.isFailed()) {
        return Result.fail(encryptedValue.getError())
      }

      const result = await this.database.saveRecords('commits', [
        {
          id: dto.commitId,
          data: encryptedValue.getValue(),
        },
      ])

      return result
    } catch (error) {
      this.logger.error(`[CacheService] Failed to cache commit ${dto.commitId}: ${error}`)
      return Result.fail(`Failed to cache commit ${dto.commitId}: ${error}`)
    }
  }

  async getCachedCommit(dto: { commitId: string }): Promise<Result<Commit | undefined>> {
    try {
      const recordsResult = await this.database.getRecordsByIndex('commits', 'id', dto.commitId)
      if (recordsResult.isFailed()) {
        return Result.fail(recordsResult.getError())
      }

      const records = recordsResult.getValue()
      if (records.length === 0) {
        this.logger.info(`[CacheService] ❌ No cached commit ${dto.commitId}`)
        return Result.ok(undefined)
      }

      const record = records[0]

      const key = await this.encryptionKey
      const decryptedValue = await this.encryptionService.decryptDataForLocalStorage(
        record.data,
        this.cacheConfig.namespace,
        key,
      )
      if (decryptedValue.isFailed()) {
        return Result.fail(decryptedValue.getError())
      }

      this.logger.info(`[CacheService] ✅ Loaded cached commit ${dto.commitId}`)

      return Result.ok(Commit.deserializeBinary(decryptedValue.getValue()))
    } catch (error) {
      this.logger.error(`[CacheService] Failed to load cached commit ${dto.commitId}: ${error}`)
      return Result.fail(`Failed to load cached commit ${dto.commitId}: ${error}`)
    }
  }

  static getLocalIDForDocumentFromCache(nodeMeta: DocumentIdentifier): number | undefined {
    try {
      const key = keyForDocument(nodeMeta)
      const cache = localStorage.getItem(key)
      if (!cache) {
        return undefined
      }
      const localId = JSON.parse(cache)
      if (typeof localId === 'number' && !Number.isNaN(localId)) {
        return localId
      }
      return undefined
    } catch (_) {
      return undefined
    }
  }

  static setLocalIDForDocumentInCache(nodeMeta: DocumentIdentifier, localID: number) {
    try {
      const key = keyForDocument(nodeMeta)
      localStorage.setItem(key, JSON.stringify(localID))
    } catch (_) {
      return
    }
  }
}

function keyForDocument(nodeMeta: DocumentIdentifier) {
  if ('volumeId' in nodeMeta) {
    return `local-id:${nodeMeta.volumeId}&${nodeMeta.linkId}`
  }
  return `local-id:${nodeMeta.token}`
}
