export const tokenIsValid = (token: string) => {
    const expectedLength = 10;
    const validPattern = /^[a-zA-Z0-9]+$/;
    if (token.length !== expectedLength || !validPattern.test(token)) {
        return false;
    }
    return true;
};

export const getTokenFromSearchParams = () => {
    // TODO: Add case when token is undefined remove it from url
    const urlSearchParams = new URLSearchParams(window.location.search);
    const token = urlSearchParams.get('token');
    if (!token || !tokenIsValid(token)) {
        return;
    }
    return token;
};
