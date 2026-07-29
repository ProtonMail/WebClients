import { createContext, useContext } from 'react';

interface DownloadProviderState {
    /**
     * Adds a thumbnail to the download queue.
     *
     * @param domRef If provided, will cancel the query if `ref.current` is null
     *               when the queue processes the thumbnail. This is useful to
     *               avoid processing items which are no longer visible.
     */
    addToDownloadQueue: (
        shareId: string,
        linkId: string,
        activeRevisionId?: string,
        domRef?: React.MutableRefObject<unknown>
    ) => void;
}

const ThumbnailsDownloadContext = createContext<DownloadProviderState | null>(null);

export const useThumbnailsDownload = () => {
    const state = useContext(ThumbnailsDownloadContext);
    if (!state) {
        throw new Error('Trying to use uninitialized ThumbnailsDonwloadProvider');
    }
    return state;
};
