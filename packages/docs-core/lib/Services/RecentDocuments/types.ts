export type RecentDocumentServiceState = 'not_fetched' | 'fetching' | 'resolving' | 'done'

type SerializableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SerializableValue[]
  | { [key: string]: SerializableValue }

export type LocalStorageValue = {
  [key: string]: SerializableValue
}
