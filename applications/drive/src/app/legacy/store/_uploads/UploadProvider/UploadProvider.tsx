import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { UploadProviderState } from './UploadProviderState';
import { usePublicUpload, useUpload } from './useUpload';

const UploadContext = createContext<UploadProviderState | null>(null);

export const UploadProvider = ({ children }: { children: ReactNode }) => {
    const [providerState, { conflictModal, fileThresholdModal }] = useUpload();

    return (
        <UploadContext.Provider value={{ ...providerState }}>
            {children}
            {conflictModal}
            {fileThresholdModal}
        </UploadContext.Provider>
    );
};

export const PublicUploadProvider = ({ children }: { children: ReactNode }) => {
    const [providerState, { conflictModal, fileThresholdModal }] = usePublicUpload();

    return (
        <UploadContext.Provider value={{ ...providerState }}>
            {children}
            {conflictModal}
            {fileThresholdModal}
        </UploadContext.Provider>
    );
};

export const useUploadProvider = (): UploadProviderState => {
    const state = useContext(UploadContext);
    if (!state) {
        throw new Error('Trying to use uninitialized UploadProvider');
    }
    return state;
};
