export const InactiveSessionError = () => {
    const error = new Error('Inactive session');
    error.name = 'InactiveSession';
    return error;
};

export const AppVersionBadError = () => {
    const error = new Error('App version outdated');
    error.name = 'AppVersionBadError';
    return error;
};
