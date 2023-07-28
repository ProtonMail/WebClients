import { FC, createContext, useContext } from 'react';

import useSharesState from '../_shares/useSharesState';

export const PhotosContext = createContext<{
    shareId?: string;
    linkId?: string;
} | null>(null);

export const PhotosProvider: FC = ({ children }) => {
    const { getPhotosShare, getDefaultShareId } = useSharesState();
    const share = getPhotosShare();

    if (!getDefaultShareId()) {
        return <PhotosContext.Provider value={null}>{children}</PhotosContext.Provider>;
    }

    return (
        <PhotosContext.Provider
            value={{
                shareId: share?.shareId,
                linkId: share?.rootLinkId,
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
