export type DocsRoute = {
  method: 'get' | 'post' | 'put' | 'delete'
  url: string
  data?: any
  input?: 'protobuf' | 'raw'
  output?: 'protobuf' | 'raw'
  silence?: boolean
  headers?: { [key: string]: string }
  timeout?: number
}
