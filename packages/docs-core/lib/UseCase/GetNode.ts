import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '@proton/docs-shared'
import type { NodeMeta, PublicNodeMeta, DecryptedNode } from '@proton/drive-store'
import { getErrorString } from '../Util/GetErrorString'
import { isPublicNodeMeta } from '@proton/drive-store'
import type { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'
import type { CacheService } from '../Services/CacheService'
import type { CachableResult } from './CachableResult'
import type { LoggerInterface } from '@proton/utils/logs'

type GetNodeResult = CachableResult & {
  node: DecryptedNode
}

const NODE_CACHE_KEY = 'decrypted-node'

export class GetNode implements UseCaseInterface<GetNodeResult> {
  constructor(
    private compatWrapper: DriveCompatWrapper,
    private cacheService: CacheService | undefined,
    private logger: LoggerInterface,
  ) {}

  async execute(nodeMeta: NodeMeta | PublicNodeMeta, options: { useCache: boolean }): Promise<Result<GetNodeResult>> {
    try {
      if (options.useCache && this.cacheService) {
        const cachedResult = await this.cacheService.getCachedValue({
          document: nodeMeta,
          key: NODE_CACHE_KEY,
        })
        if (!cachedResult.isFailed()) {
          const value = cachedResult.getValue()
          if (value) {
            return Result.ok({ node: JSON.parse(value), fromCache: true })
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to load node from cache', getErrorString(error))
    }

    try {
      const node = isPublicNodeMeta(nodeMeta)
        ? await this.compatWrapper.getPublicCompat().getNode(nodeMeta)
        : await this.compatWrapper.getUserCompat().getNode(nodeMeta)

      if (!node) {
        return Result.fail('Incorrect compat used; node not found')
      }

      if (this.cacheService) {
        void this.cacheService.cacheValue({ document: nodeMeta, key: NODE_CACHE_KEY, value: JSON.stringify(node) })
      }

      return Result.ok({ node, fromCache: false })
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to get node')
    }
  }
}
