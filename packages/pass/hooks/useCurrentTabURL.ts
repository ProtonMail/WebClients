import { useTabsQuery } from './useTabsQuery';

export const useCurrentTabURL = (onURLResult: (url?: URL) => void) => {
    useTabsQuery({ active: true, currentWindow: true }, (tabs) => {
        const currentURL = tabs?.[0]?.url;
        onURLResult(currentURL !== undefined ? new URL(currentURL) : undefined);
    });
};
