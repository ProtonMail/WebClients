export enum CommentsEvent {
  CommentsChanged = 'CommentsChanged',
  CreateMarkNode = 'CreateMarkNode',
  RemoveMarkNode = 'RemoveMarkNode',
  ResolveMarkNode = 'ResolveMarkNode',
  UnresolveMarkNode = 'UnresolveMarkNode',
}

export type CommentMarkNodeChangeData = {
  markID: string
}
