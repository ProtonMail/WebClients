import React, { createContext, useContext, useState } from 'react';

interface FileBrowerViewProviderState {
    views: { [id: string]: 'list' | 'grid' };
    changeView: (view: 'list' | 'grid', id?: string) => void;
}

const FileBrowerLayoutContext = createContext<FileBrowerViewProviderState | null>(null);

interface Props {
    children: React.ReactNode;
}

/**
 * Manages drive initialization (starting onboarding).
 * Stores open folder shareId and linkID for easy access.
 */
const FileBrowerLayoutProvider = ({ children }: Props) => {
    const [views, setViews] = useState({});

    const changeView = (view: 'list' | 'grid', id = '_default_') => {
        setViews((views) => ({ ...views, [id]: view }));
    };

    return (
        <FileBrowerLayoutContext.Provider value={{ views, changeView }}>{children}</FileBrowerLayoutContext.Provider>
    );
};

export const useFileBrowserLayout = (id = '_default_') => {
    const state = useContext(FileBrowerLayoutContext);
    if (!state) {
        throw new Error('Trying to use uninitialized FileBrowerLayoutProvider');
    }

    const { changeView, views } = state;
    const view = views[id];

    return {
        view,
        changeView,
    };
};

export default FileBrowerLayoutProvider;
