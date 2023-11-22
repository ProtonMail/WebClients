export const globToRegExp = (globPattern: string) => {
    const regexString = globPattern
        .replace(/\//g, '\\/')
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');

    return new RegExp(`^${regexString}$`);
};
