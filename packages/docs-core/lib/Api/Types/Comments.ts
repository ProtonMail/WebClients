export type CommentType = 1 | 2

export type CommonPrivateCommentData = {
  Content: string
  AuthorEmail: string
}

export type CreatePrivateCommentData = CommonPrivateCommentData & {
  Type: CommentType
  DocumentName: string | null
}

export type CommonPublicCommentData = {
  Content: string
}

export type CreatePublicCommentData = CommonPublicCommentData & {
  Type: CommentType
  DocumentName: string | null
}

export type CommentThreadType = 1 | 2
