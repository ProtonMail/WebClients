export enum DocsApiErrorCode {
    CommitIdOutOfSync = 250_000,
}

export const getDocumentMeta = (volumeId: string, linkId: string) => ({
    method: 'get',
    url: `docs/volumes/${volumeId}/documents/${linkId}/meta`,
    silence: true,
});

export const getDocumentMetaByToken = (linkId: string, token: string, headers: { [key: string]: string }) => ({
    method: 'get',
    url: `docs/urls/${token}/documents/${linkId}/meta`,
    silence: true,
    headers,
});

export const getCommitData = (volumeId: string, linkId: string, commitId: string) => ({
    method: 'get',
    url: `docs/volumes/${volumeId}/documents/${linkId}/commits/${commitId}`,
    output: 'raw',
    silence: true,
});

export const getCommitDataByToken = (
    linkId: string,
    token: string,
    commitId: string,
    headers: { [key: string]: string }
) => ({
    method: 'get',
    url: `docs/urls/${token}/documents/${linkId}/commits/${commitId}`,
    output: 'raw',
    silence: true,
    headers,
});

export const seedInitialCommit = (volumeId: string, linkId: string, data: Uint8Array) => ({
    method: 'post',
    url: `docs/volumes/${volumeId}/documents/${linkId}/seed-initial-commit`,
    input: 'protobuf',
    data,
});

export const lockDocument = (volumeId: string, linkId: string, fetchCommitId?: string) => ({
    method: 'post',
    url: `docs/volumes/${volumeId}/documents/${linkId}/lock`,
    data: {
        FetchCommitID: fetchCommitId,
    },
    output: 'raw',
    silence: true,
});

export const squashCommit = (volumeId: string, linkId: string, commitId: string, data: Uint8Array) => ({
    method: 'put',
    url: `docs/volumes/${volumeId}/documents/${linkId}/commits/${commitId}/squash`,
    input: 'protobuf',
    data,
});

export const createDocument = (volumeId: string, linkId: string) => ({
    method: 'post',
    url: `docs/volumes/${volumeId}/documents/${linkId}`,
    data: {},
    silence: true,
});

export const getAllCommentThreadsInDocument = (volumeId: string, linkId: string) => ({
    method: 'get',
    url: `docs/volumes/${volumeId}/documents/${linkId}/threads`,
});

export const getCommentThreadInDocument = (volumeId: string, linkId: string, threadId: string) => ({
    method: 'get',
    url: `docs/volumes/${volumeId}/documents/${linkId}/threads/${threadId}`,
});

type CommentType = 1 | 2;

type CommonCommentData = {
    Content: string;
    AuthorEmail: string;
};

type CreateCommentData = CommonCommentData & {
    Type: CommentType;
    DocumentName: string | null;
};

type CommentThreadType = 1 | 2;

export const createThreadInDocument = (
    volumeId: string,
    linkId: string,
    data: {
        Mark: string;
        Comment: CreateCommentData;
        Type: CommentThreadType;
    }
) => ({
    method: 'post',
    url: `docs/volumes/${volumeId}/documents/${linkId}/threads`,
    data,
});

export const deleteThreadInDocument = (volumeId: string, linkId: string, threadId: string) => ({
    method: 'delete',
    url: `docs/volumes/${volumeId}/documents/${linkId}/threads/${threadId}`,
});

export const resolveThreadInDocument = (volumeId: string, linkId: string, threadId: string) => ({
    method: 'put',
    url: `docs/volumes/${volumeId}/documents/${linkId}/threads/${threadId}/resolve`,
});

export const unresolveThreadInDocument = (volumeId: string, linkId: string, threadId: string) => ({
    method: 'put',
    url: `docs/volumes/${volumeId}/documents/${linkId}/threads/${threadId}/unresolve`,
});

export const changeSuggestionThreadState = (
    volumeId: string,
    linkId: string,
    threadId: string,
    action: 'accept' | 'reject' | 'reopen'
) => ({
    method: 'put',
    url: `docs/volumes/${volumeId}/documents/${linkId}/threads/${threadId}/suggestion/${action}`,
});

export const addCommentToThreadInDocument = (
    volumeId: string,
    linkId: string,
    threadId: string,
    data: CreateCommentData & { ParentCommentId: string | null }
) => ({
    method: 'post',
    url: `docs/volumes/${volumeId}/documents/${linkId}/threads/${threadId}`,
    data: data,
});

export const editCommentInThreadInDocument = (
    volumeId: string,
    linkId: string,
    threadId: string,
    commentId: string,
    data: CommonCommentData
) => ({
    method: 'put',
    url: `docs/volumes/${volumeId}/documents/${linkId}/threads/${threadId}/comments/${commentId}`,
    data: data,
});

export const deleteCommentInThreadInDocument = (
    volumeId: string,
    linkId: string,
    threadId: string,
    commentId: string
) => ({
    method: 'delete',
    url: `docs/volumes/${volumeId}/documents/${linkId}/threads/${threadId}/comments/${commentId}`,
});

export const createRealtimeValetToken = (volumeId: string, linkId: string, commitId?: string) => ({
    method: 'post',
    url: `docs/volumes/${volumeId}/documents/${linkId}/tokens`,
    silence: true,
    data: {
        LastCommitID: commitId ?? null,
    },
});
