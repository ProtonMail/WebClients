export const LockedSessionError = () => {
    const error = new Error('Session locked');
    error.name = 'LockedSession';
    return error;
};
