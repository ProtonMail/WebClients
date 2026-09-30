export const queryFileRevision = (
    shareId: string,
    linkId: string,
    revisionId: string,
    pagination?: { FromBlockIndex: number; PageSize: number }
) => {
    const query = {
        method: 'get',
        url: `drive/shares/${shareId}/files/${linkId}/revisions/${revisionId}`,
        silence: true,
    };

    if (pagination) {
        return {
            ...query,
            params: pagination,
        };
    }

    return query;
};

export const queryFileRevisionThumbnail = (
    shareId: string,
    linkId: string,
    revisionId: string,
    thumbnailType: 1 | 2 | 3 = 1
) => {
    return {
        method: 'get',
        url: `drive/shares/${shareId}/files/${linkId}/revisions/${revisionId}/thumbnail?Type=${thumbnailType}`,
        silence: true,
    };
};
