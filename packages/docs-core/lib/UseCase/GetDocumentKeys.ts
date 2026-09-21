import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '@proton/docs-shared'
import type { DriveCompat } from '@proton/drive-store'
import type { NodeMeta, DocumentKeys } from '@proton/docs-shared'
import { getErrorString } from '../Util/GetErrorString'
import type { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'
import type { CacheService } from '../Services/CacheService'
import type { CachableResult } from './CachableResult'
import type { SessionKey } from '@protontech/crypto'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import { getDocumentKeys, type PrimaryAddressKeys } from '../DriveSDK/getDocumentKeys'
import type { UnleashClient } from '@proton/unleash/UnleashClient'
import { isDriveCompatSDKEnabled } from '../Util/isDriveCompatSDKEnabled'

type GetDocumentKeysResult = CachableResult & {
  keys: DocumentKeys
}

const CONTENT_KEY_CACHE_KEY = 'content-key'

type Base64String = string

export class GetDocumentKeys implements UseCaseInterface<GetDocumentKeysResult> {
  constructor(
    private compatWrapper: DriveCompatWrapper,
    private cacheService: CacheService,
    private logger: LoggerInterface,
    private unleashClient: UnleashClient,
  ) {}

  async execute(
    nodeMeta: NodeMeta,
    options: { useCache: boolean },
    primaryAddressKeys?: PrimaryAddressKeys,
  ): Promise<Result<GetDocumentKeysResult>> {
    try {
      if (options.useCache) {
        const cachedResult = await this.loadFromCache(nodeMeta, primaryAddressKeys)
        if (!cachedResult.isFailed()) {
          const value = cachedResult.getValue()
          if (value) {
            return Result.ok(value)
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to load document keys from cache', getErrorString(error))
    }

    try {
      const useSDK = isDriveCompatSDKEnabled(this.unleashClient)
      const documentContentKey = useSDK
        ? await getDocumentKeys(nodeMeta)
        : await this.compatWrapper.getCompat<DriveCompat>().getDocumentKeys(nodeMeta)

      const addressWithKeys =
        primaryAddressKeys ?? (await this.compatWrapper.getCompat<DriveCompat>().getPrimaryAddressKeys())
      if (!addressWithKeys) {
        return Result.fail('No primary address keys found')
      }

      const { keys: addressKeys, address } = addressWithKeys
      const keys: DocumentKeys = {
        documentContentKey,
        userAddressPrivateKey: addressKeys[0].privateKey,
        userOwnAddress: address,
      }

      void this.cacheService.cacheValue({
        document: nodeMeta,
        key: CONTENT_KEY_CACHE_KEY,
        value: JSON.stringify(serializeSessionKey(keys.documentContentKey)),
      })

      return Result.ok({ keys, fromCache: false })
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to get document keys')
    }
  }

  private async loadFromCache(
    nodeMeta: NodeMeta,
    primaryAddressKeys?: PrimaryAddressKeys,
  ): Promise<Result<GetDocumentKeysResult | undefined>> {
    const cachedDocumentKey = await this.cacheService.getCachedValue({
      document: nodeMeta,
      key: CONTENT_KEY_CACHE_KEY,
    })

    if (cachedDocumentKey.isFailed()) {
      return Result.fail(cachedDocumentKey.getError())
    }

    const value = cachedDocumentKey.getValue()
    if (!value) {
      return Result.ok(undefined)
    }

    const resolvedAddrKeys =
      primaryAddressKeys ?? (await this.compatWrapper.getCompat<DriveCompat>().getPrimaryAddressKeys())
    if (!resolvedAddrKeys) {
      return Result.fail('No primary address keys found')
    }

    const { keys, address } = resolvedAddrKeys
    const restoredKeys: DocumentKeys = {
      userAddressPrivateKey: keys[0].privateKey,
      userOwnAddress: address,
      documentContentKey: deserializeSessionKey(JSON.parse(value)),
    }

    return Result.ok({ keys: restoredKeys, fromCache: true })
  }
}

type CachedSessionKey = {
  data: Base64String
  algorithm: SessionKey['algorithm']
  aeadAlgorithm?: SessionKey['aeadAlgorithm']
}

function serializeSessionKey(sessionKey: SessionKey): CachedSessionKey {
  return {
    data: sessionKey.data.toBase64(),
    algorithm: sessionKey.algorithm,
    aeadAlgorithm: sessionKey.aeadAlgorithm,
  }
}

function deserializeSessionKey(cachedSessionKey: CachedSessionKey): SessionKey {
  return {
    data: Uint8Array.fromBase64(cachedSessionKey.data),
    algorithm: cachedSessionKey.algorithm,
    aeadAlgorithm: cachedSessionKey.aeadAlgorithm,
  } as SessionKey
}
