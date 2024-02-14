export const InactiveSessionError = (originalError?: any) => {
    const error = new Error('Inactive session');
    error.name = 'InactiveSession';
    // @ts-ignore
    error.originalError = originalError;
    return error;
};

export const AppVersionBadError = () => {
    const error = new Error('App version outdated');
    error.name = 'AppVersionBadError';
    return error;
};
