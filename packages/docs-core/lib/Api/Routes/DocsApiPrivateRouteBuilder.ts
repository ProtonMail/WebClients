import type { CommentThreadType, CommonPrivateCommentData, CreatePrivateCommentData } from '../Types/Comments'
import { DocsApiRouteBuilder } from './DocsApiRouteBuilder'
import type { DocsRoute } from './DocsRoute'
import { COMMIT_FETCH_TIMEOUT } from '@proton/shared/lib/docs/constants'

/**
 * For private authenticated routes.
 */
export class DocsApiPrivateRouteBuilder extends DocsApiRouteBuilder {
  constructor(params: { volumeId: string; linkId: string }) {
    super(`docs/volumes/${params.volumeId}/documents/${params.linkId}`)
  }

  meta(): DocsRoute {
    return {
      method: 'get',
      url: `${this.basePath}/meta`,
      silence: true,
    }
  }

  commit(params: { commitId: string }): DocsRoute {
    return {
      method: 'get',
      url: `${this.basePath}/commits/${params.commitId}`,
      output: 'raw',
      silence: true,
      timeout: COMMIT_FETCH_TIMEOUT,
    }
  }

  seedInitialCommit(params: { data: Uint8Array<ArrayBuffer> }): DocsRoute {
    return {
      method: 'post',
      url: `${this.basePath}/seed-initial-commit`,
      input: 'protobuf',
      data: params.data,
    }
  }

  lock(params: { fetchCommitId?: string }): DocsRoute {
    return {
      method: 'post',
      url: `${this.basePath}/lock`,
      data: { FetchCommitID: params.fetchCommitId },
      output: 'raw',
      silence: true,
    }
  }

  squashCommit(params: { commitId: string; data: Uint8Array<ArrayBuffer> }): DocsRoute {
    return {
      method: 'put',
      url: `${this.basePath}/commits/${params.commitId}/squash`,
      input: 'protobuf',
      data: params.data,
    }
  }

  createDocument(): DocsRoute {
    return {
      method: 'post',
      url: `${this.basePath}`,
      silence: true,
      data: {},
    }
  }

  getCommentThreads(): DocsRoute {
    return {
      method: 'get',
      url: `${this.basePath}/threads`,
    }
  }

  createThread(params: {
    data: { Mark: string; Comment: CreatePrivateCommentData; Type: CommentThreadType }
  }): DocsRoute {
    return {
      method: 'post',
      url: `${this.basePath}/threads`,
      data: params.data,
    }
  }

  deleteThread(params: { threadId: string }): DocsRoute {
    return {
      method: 'delete',
      url: `${this.basePath}/threads/${params.threadId}`,
    }
  }

  addComment(params: {
    threadId: string
    data: CreatePrivateCommentData & { ParentCommentId: string | null }
  }): DocsRoute {
    return {
      method: 'post',
      url: `${this.basePath}/threads/${params.threadId}`,
      data: params.data,
    }
  }

  getThread(params: { threadId: string }): DocsRoute {
    return {
      method: 'get',
      url: `${this.basePath}/threads/${params.threadId}`,
    }
  }

  resolveThread(params: { threadId: string }): DocsRoute {
    return {
      method: 'put',
      url: `${this.basePath}/threads/${params.threadId}/resolve`,
    }
  }

  editComment(params: { threadId: string; commentId: string; data: CommonPrivateCommentData }): DocsRoute {
    return {
      method: 'put',
      url: `${this.basePath}/threads/${params.threadId}/comments/${params.commentId}`,
      data: params.data,
    }
  }

  unresolveThread(params: { threadId: string }): DocsRoute {
    return {
      method: 'put',
      url: `${this.basePath}/threads/${params.threadId}/unresolve`,
    }
  }

  changeSuggestionState(params: { threadId: string; action: 'accept' | 'reject' | 'reopen' }): DocsRoute {
    return {
      method: 'put',
      url: `${this.basePath}/threads/${params.threadId}/suggestion/${params.action}`,
    }
  }

  deleteComment(params: { threadId: string; commentId: string }): DocsRoute {
    return {
      method: 'delete',
      url: `${this.basePath}/threads/${params.threadId}/comments/${params.commentId}`,
    }
  }

  createRealtimeValetToken(params: { commitId?: string }): DocsRoute {
    return {
      method: 'post',
      url: `${this.basePath}/tokens`,
      data: { LastCommitID: params.commitId ?? null },
      silence: true,
    }
  }
}
