export const initiateSessionRecovery = () => ({
    url: 'account/v1/recovery/session',
    method: 'POST',
});

export const abortSessionRecovery = () => ({
    url: 'account/v1/recovery/session/abort',
    method: 'POST',
});
