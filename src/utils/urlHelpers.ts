const sessionRegex = /(?!:\/u\/)(\d+)(?!:\/)/g;
export const getSessionID = (url: string) => {
    const pathName = new URL(url).pathname;
    return pathName.match(sessionRegex)?.[0];
};
