export type PendingMessage = {
  messageId: string
  resolve: (value: any | PromiseLike<any>) => void
}
