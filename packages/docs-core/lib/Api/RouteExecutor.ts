import type { Api } from '@proton/shared/lib/interfaces'
import type { DocsRoute } from './Routes/DocsRoute'
import { getErrorString } from '../Util/GetErrorString'
import { ApiResult } from '@proton/docs-shared'
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper'

export class RouteExecutor {
  public inflight: number = 0

  constructor(private readonly protonApi: Api) {}

  async execute<R>(route: DocsRoute): Promise<ApiResult<R>> {
    try {
      this.inflight++
      const response = await this.protonApi(route)
      if (route.output === 'raw') {
        const buffer = await response.arrayBuffer()
        return ApiResult.ok(new Uint8Array(buffer) as R)
      }
      return ApiResult.ok(response)
    } catch (error) {
      return ApiResult.fail({ message: getErrorString(error) || 'Unknown error', code: getApiError(error).code })
    } finally {
      this.inflight--
    }
  }
}
