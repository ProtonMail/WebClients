export const queryListShareAutoRestore = () => {
    return {
        method: 'get',
        url: `drive/sanitization/asv`,
    };
};

export const querySendShareAutoRestoreStatus = ({ Shares }: { Shares: { ShareID: string; Reason: string }[] }) => {
    return {
        method: 'post',
        url: `drive/sanitization/asv`,
        data: { Shares },
    };
};

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
