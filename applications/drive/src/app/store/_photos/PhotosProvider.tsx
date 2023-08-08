import { FC, createContext, useContext } from 'react';

import useSharesState from '../_shares/useSharesState';

export const PhotosContext = createContext<{
    shareId?: string;
    linkId?: string;
    hasPhotosShare: boolean;
    isLoading: boolean;
} | null>(null);

export const PhotosProvider: FC = ({ children }) => {
    const { getPhotosShare, getDefaultShareId } = useSharesState();
    const defaultShareId = getDefaultShareId();
    const share = getPhotosShare();

    if (!defaultShareId) {
        return <PhotosContext.Provider value={null}>{children}</PhotosContext.Provider>;
    }

    return (
        <PhotosContext.Provider
            value={{
                shareId: share?.shareId,
                linkId: share?.rootLinkId,
                hasPhotosShare: !!share,
                isLoading: !defaultShareId && !share,
            }}
        >
            {children}
        </PhotosContext.Provider>
    );
};

export function usePhotos() {
    const state = useContext(PhotosContext);
    if (!state) {
        throw new Error('Trying to use uninitialized PhotosProvider');
    }
    return state;
}
