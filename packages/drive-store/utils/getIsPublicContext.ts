export const getIsPublicContext = () => {
    return new URLSearchParams(window.location.search).get('mode') === 'open-url';
};
