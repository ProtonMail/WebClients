import type { CommentThreadType, CommonPublicCommentData, CreatePublicCommentData } from '../Types/Comments'
import type { DocsRoute } from './DocsRoute'
import { DocsApiRouteBuilder } from './DocsApiRouteBuilder'

/** For public token-based routes */
export class DocsApiPublicRouteBuilder extends DocsApiRouteBuilder {
  private headers: { [key: string]: string }

  constructor(params: { token: string; linkId: string; headers: { [key: string]: string } }) {
    super(`docs/urls/${params.token}/documents/${params.linkId}`)
    this.headers = params.headers
  }

  meta(): DocsRoute {
    return {
      method: 'get',
      url: `${this.basePath}/meta`,
      silence: true,
      headers: this.headers,
    }
  }

  commit(params: { commitId: string }): DocsRoute {
    return {
      method: 'get',
      url: `${this.basePath}/commits/${params.commitId}`,
      output: 'raw',
      silence: true,
      headers: this.headers,
    }
  }

  /** Returns the IDs of all threads in the document */
  getCommentThreads(): DocsRoute {
    return {
      method: 'get',
      url: `${this.basePath}/threads`,
      headers: this.headers,
    }
  }

  createThread(params: {
    data: {
      Mark: string
      Comment: CreatePublicCommentData & { AuthorEmail: string | undefined }
      Type: CommentThreadType
    }
  }): DocsRoute {
    return {
      method: 'post',
      url: `${this.basePath}/threads`,
      data: params.data,
      headers: this.headers,
    }
  }

  addComment(params: {
    threadId: string
    data: CreatePublicCommentData & { ParentCommentId: string | null; AuthorEmail: string | undefined }
  }): DocsRoute {
    return {
      method: 'post',
      url: `${this.basePath}/threads/${params.threadId}`,
      data: params.data,
      headers: this.headers,
    }
  }

  editComment(params: {
    threadId: string
    commentId: string
    data: CommonPublicCommentData & { AuthorEmail: string | undefined }
  }): DocsRoute {
    return {
      method: 'put',
      url: `${this.basePath}/threads/${params.threadId}/comments/${params.commentId}`,
      data: params.data,
      headers: this.headers,
    }
  }

  getThread(params: { threadId: string }): DocsRoute {
    return {
      method: 'get',
      url: `${this.basePath}/threads/${params.threadId}`,
      headers: this.headers,
    }
  }

  resolveThread(params: { threadId: string }): DocsRoute {
    return {
      method: 'put',
      url: `${this.basePath}/threads/${params.threadId}/resolve`,
      headers: this.headers,
    }
  }

  deleteThread(params: { threadId: string }): DocsRoute {
    return {
      method: 'delete',
      url: `${this.basePath}/threads/${params.threadId}`,
    }
  }

  unresolveThread(params: { threadId: string }): DocsRoute {
    return {
      method: 'put',
      url: `${this.basePath}/threads/${params.threadId}/unresolve`,
      headers: this.headers,
    }
  }

  changeSuggestionState(params: { threadId: string; action: 'accept' | 'reject' | 'reopen' }): DocsRoute {
    return {
      method: 'put',
      url: `${this.basePath}/threads/${params.threadId}/suggestion/${params.action}`,
      headers: this.headers,
    }
  }

  deleteComment(params: { threadId: string; commentId: string }): DocsRoute {
    return {
      method: 'delete',
      url: `${this.basePath}/threads/${params.threadId}/comments/${params.commentId}`,
      headers: this.headers,
    }
  }

  createRealtimeValetToken(params: { commitId?: string }): DocsRoute {
    return {
      method: 'post',
      url: `${this.basePath}/tokens`,
      data: { LastCommitID: params.commitId ?? null },
      silence: true,
      headers: this.headers,
    }
  }
}
