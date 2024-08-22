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
