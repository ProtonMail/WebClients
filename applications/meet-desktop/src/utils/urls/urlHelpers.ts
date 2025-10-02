export const addHashToCurrentURL = (currentURLString: string, hash: string) => {
    try {
        const currentURL = new URL(currentURLString);
        if (currentURL.hash) {
            currentURL.hash.replace("#", "");
        }
        currentURL.hash = hash;
        return currentURL.toString();
    } catch (error) {
        console.error("Error while parsing addHashToCurrentURL url");
    }
    return currentURLString;
};

export const parseURLParams = (url: string): URLSearchParams | undefined => {
    const question = url.indexOf("?");
    if (question === -1 || question === url.length - 1) return undefined;

    return new URLSearchParams(url.substring(question + 1));
};
