export const isConnectionTimeoutError = (error: any): boolean => {
    const msg = error?.message || '';
    return msg.includes('Connection timeout after');
};
