export const getIsPublicContext = () => {
    return window.location.pathname.startsWith('/urls');
};
