const sessionRegex = /\/u\/(\d+)\//;
export const getLocalID = (url = window.location.href): string | null => {
    try {
        const pathName = new URL(url).pathname;
        const match = pathName.match(sessionRegex);
        const localID = match ? match[1] : null;
        return localID;
    } catch {
        return null;
    }
};
