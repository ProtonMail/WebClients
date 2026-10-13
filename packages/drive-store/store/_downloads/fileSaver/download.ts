export const isServiceWorkersUnsupported = () => {
    return !('serviceWorker' in navigator);
};
