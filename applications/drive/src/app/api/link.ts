export const queryCheckAvailableHashes = (shareId: string, linkId: string, data: { Hashes: string[] }) => {
    return {
        method: 'post',
        url: `drive/shares/${shareId}/links/${linkId}/checkAvailableHashes`,
        data
    };
};
