export const isMainFrame = (): boolean => {
    try {
        return window.self === window.top;
    } catch (e) {
        return false;
    }
};
