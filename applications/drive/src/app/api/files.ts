export const queryFile = (shareId: string, linkId: string) => {
    return {
        method: 'get',
        url: `drive/shares/${shareId}/files/${linkId}`
    };
};

export const queryFileRevision = (shareId: string, linkId: string, revisionId: number) => {
    return {
        method: 'get',
        url: `drive/shares/${shareId}/files/${linkId}/revisions/${revisionId}`
    };
};

export const queryFileBlock = (url: string) => {
    return {
        method: 'get',
        output: 'stream',
        url
    };
};
