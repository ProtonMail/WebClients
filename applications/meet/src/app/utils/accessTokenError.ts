// Errors of the access-token request, so a code the backend also uses elsewhere is read as the access token's
const accessTokenErrors = new WeakSet<object>();

export const markAccessTokenError = (error: unknown) => {
    if (error && typeof error === 'object') {
        accessTokenErrors.add(error);
    }
};

export const isAccessTokenError = (error: unknown) =>
    !!error && typeof error === 'object' && accessTokenErrors.has(error);
