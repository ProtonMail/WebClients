import { FC, createContext } from 'react';

export const PhotosContext = createContext({});

export const PhotosProvider: FC = ({ children }) => {
    return <PhotosContext.Provider value={{}}>{children}</PhotosContext.Provider>;
};
