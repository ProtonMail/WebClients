export const getDocumentMeta = (volumeId: string, linkId: string) => ({
    method: 'get',
    url: `docs/volumes/${volumeId}/documents/${linkId}/meta`,
});

export const getCommitData = (volumeId: string, linkId: string, commitId: string) => ({
    method: 'get',
    url: `docs/volumes/${volumeId}/documents/${linkId}/commits/${commitId}`,
    output: 'raw',
});

export const createCommit = (volumeId: string, linkId: string, data: Uint8Array) => ({
    method: 'post',
    url: `docs/volumes/${volumeId}/documents/${linkId}/commits`,
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
});

export const getAllCommentThreadsInDocument = (volumeId: string, linkId: string) => ({
    method: 'get',
    url: `docs/volumes/${volumeId}/documents/${linkId}/threads`,
});

export const getCommentThreadInDocument = (volumeId: string, linkId: string, threadId: string) => ({
    method: 'get',
    url: `docs/volumes/${volumeId}/documents/${linkId}/threads/${threadId}`,
});

type CommonCommentData = {
    Content: string;
};

export const createThreadInDocument = (
    volumeId: string,
    linkId: string,
    data: { Mark: string; Comment: CommonCommentData }
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

export const addCommentToThreadInDocument = (
    volumeId: string,
    linkId: string,
    threadId: string,
    data: CommonCommentData & { ParentCommentId: string | null }
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
    data: {
        LastCommitID: commitId ?? null,
    },
});
