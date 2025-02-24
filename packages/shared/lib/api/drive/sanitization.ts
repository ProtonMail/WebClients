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
