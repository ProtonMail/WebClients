import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import type { DocumentRole } from '@proton/docs-shared'
import { Result } from '@proton/docs-shared'
import type { NodeMeta } from '@proton/drive-store'
import { getErrorString } from '../Util/GetErrorString'
import type { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'
import type { CacheService } from '../Services/CacheService'
import type { CachableResult } from './CachableResult'
import { rawPermissionToRole } from '../Types/DocumentEntitlements'
import type { LoggerInterface } from '@proton/utils/logs'

type GetNodePermissionsResult = CachableResult & {
  role: DocumentRole
}

const NODE_PERMISSIONS_CACHE_KEY = 'node-permissions'

export class GetNodePermissions implements UseCaseInterface<GetNodePermissionsResult> {
  constructor(
    private compatWrapper: DriveCompatWrapper,
    private cacheService: CacheService,
    private logger: LoggerInterface,
  ) {}

  async execute(nodeMeta: NodeMeta, options: { useCache: boolean }): Promise<Result<GetNodePermissionsResult>> {
    try {
      if (options.useCache) {
        const cachedPermissions = await this.cacheService.getCachedValue({
          document: nodeMeta,
          key: NODE_PERMISSIONS_CACHE_KEY,
        })
        if (!cachedPermissions.isFailed()) {
          const value = cachedPermissions.getValue()
          if (value) {
            return Result.ok({ role: rawPermissionToRole(JSON.parse(value)), fromCache: true })
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to load node permissions from cache', getErrorString(error))
    }

    try {
      const permissions = await this.compatWrapper.getUserCompat().getNodePermissions(nodeMeta)

      if (!permissions) {
        return Result.fail('Incorrect compat used; permissions not found')
      }

      void this.cacheService.cacheValue({
        document: nodeMeta,
        key: NODE_PERMISSIONS_CACHE_KEY,
        value: JSON.stringify(permissions),
      })

      const role = rawPermissionToRole(permissions)

      return Result.ok({ role, fromCache: false })
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to get node permissions')
    }
  }
}
