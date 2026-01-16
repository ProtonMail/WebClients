export const getIsPublicContext = () => {
    return ['open-url', 'open-url-download'].includes(new URLSearchParams(window.location.search).get('mode') || '');
};
