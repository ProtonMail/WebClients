import type { DocsRoute } from './DocsRoute'

export class DocsApiRouteBuilder {
  protected basePath: string

  constructor(basePath: string) {
    this.basePath = basePath
  }

  recentDocuments(): DocsRoute {
    return {
      method: 'get',
      url: `${this.basePath}/recent`,
    }
  }
}
