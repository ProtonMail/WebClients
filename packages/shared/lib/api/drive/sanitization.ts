export const queryListNodesWithMissingNodeHashKeys = () => {
    return {
        method: 'get',
        url: `drive/sanitization/mhk`,
    };
};

export const querySendNodesWithNewNodeHashKeys = ({
    NodesWithMissingNodeHashKey,
}: {
    NodesWithMissingNodeHashKey: {
        LinkID: string;
        ShareID: string;
        VolumeID: string;
        PGPArmoredEncryptedNodeHashKey: string;
    }[];
}) => {
    return {
        method: 'post',
        url: `drive/sanitization/mhk`,
        data: { NodesWithMissingNodeHashKey },
    };
};
