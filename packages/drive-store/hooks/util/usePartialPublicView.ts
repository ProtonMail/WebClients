import { useMemo } from 'react';

export const partialPublicViewKey = 'partialPublicView';

const cleanupUrl = () => {
    const newUrlSearchParams = new URLSearchParams(window.location.search);
    newUrlSearchParams.delete(partialPublicViewKey);
    const hash = window.location.hash;
    const newUrl = `${window.location.origin}${window.location.pathname}${newUrlSearchParams.toString() ? `?${newUrlSearchParams.toString()}` : ''}${hash}`;
    window.history.replaceState({}, '', newUrl);
};
const getIsPartialPublicView = () => {
    const { search } = window.location;
    cleanupUrl();
    return new URLSearchParams(search).get(partialPublicViewKey) === 'true';
};

const usePartialPublicView = () => {
    const isPartialPublicView = useMemo(() => getIsPartialPublicView(), []);

    return isPartialPublicView;
};

export { usePartialPublicView };
