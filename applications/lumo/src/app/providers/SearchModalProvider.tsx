import React, { createContext, useContext, useRef, useCallback } from 'react';

interface SearchModalContextValue {
    openSearchModal: () => void;
    registerOpenFunction: (fn: () => void) => void;
}

const SearchModalContext = createContext<SearchModalContextValue | null>(null);

export const SearchModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const openSearchModalRef = useRef<(() => void) | null>(null);

    const registerOpenFunction = useCallback((fn: () => void) => {
        openSearchModalRef.current = fn;
    }, []);

    const openSearchModal = useCallback(() => {
        openSearchModalRef.current?.();
    }, []);

    return (
        <SearchModalContext.Provider value={{ openSearchModal, registerOpenFunction }}>
            {children}
        </SearchModalContext.Provider>
    );
};

export const useSearchModal = () => {
    const context = useContext(SearchModalContext);
    if (!context) {
        throw new Error('useSearchModal must be used within SearchModalProvider');
    }
    return context;
};

