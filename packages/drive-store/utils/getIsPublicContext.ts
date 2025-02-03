export const getIsPublicContext = () => {
    const mode = new URLSearchParams(window.location.search).get('mode');
    return mode && ['open-url', 'open-url-download'].includes(mode);
};
