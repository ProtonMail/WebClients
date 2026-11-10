import type { ApiRequest } from './api'

// Copied from packages/docs-core/lib/Api/Types/GetRecentsResponse.ts
export type RecentDocumentAPIItem = {
  VolumeID: string
  LinkID: string
  LastOpenTime: number
  ContextShareID: string
  // Most immediate parent first, root last (My files root, or the share root for items shared with me)
  AncestorIDs: string[]
}

// Copied from packages/docs-core/lib/Api/Types/GetRecentsResponse.ts
export type GetRecentsResponse = {
  RecentDocuments: RecentDocumentAPIItem[]
  Code: '1000'
}

// Copied from `recentDocuments` in packages/docs-core/lib/Api/Routes/DocsApiRouteBuilder.ts
export function getRecentDocuments(): ApiRequest {
  return { method: 'get', url: 'docs/recent' }
}
