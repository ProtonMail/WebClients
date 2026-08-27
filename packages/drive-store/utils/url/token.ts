export const tokenIsValid = (token: string) => {
    const expectedLength = 10;
    const validPattern = /^[a-zA-Z0-9]+$/;
    if (token.length !== expectedLength || !validPattern.test(token)) {
        return false;
    }
    return true;
};
