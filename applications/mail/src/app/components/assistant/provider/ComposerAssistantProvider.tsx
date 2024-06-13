import React, { ReactNode, createContext, useContext } from 'react';

import { useModalStateObject } from '@proton/components/components';
import { AssistantIncompatibleBrowserModal, AssistantIncompatibleHardwareModal } from '@proton/components/containers';

interface ComposerAssistantContextType {
    displayAssistantModal: (modalType: 'incompatibleHardware' | 'incompatibleBrowser') => void;
}

export const ComposerAssistantContext = createContext<ComposerAssistantContextType | undefined>(undefined);

export const useComposerAssistantProvider = () => {
    const context = useContext(ComposerAssistantContext);

    if (context === undefined) {
        throw new Error('Component should be wrapped inside ComposerAssistantProvider');
    }

    return context;
};

export const ComposerAssistantProvider = ({ children }: { children: ReactNode }) => {
    const incompatibleHardwareModal = useModalStateObject();
    const incompatibleBrowserModal = useModalStateObject();

    const displayAssistantModal = (modalType: 'incompatibleHardware' | 'incompatibleBrowser') => {
        if (modalType === 'incompatibleHardware') {
            incompatibleHardwareModal.openModal(true);
        }

        if (modalType === 'incompatibleBrowser') {
            incompatibleBrowserModal.openModal(true);
        }
    };

    return (
        <ComposerAssistantContext.Provider value={{ displayAssistantModal }}>
            {children}
            {incompatibleHardwareModal.render && (
                <AssistantIncompatibleHardwareModal modalProps={incompatibleHardwareModal.modalProps} />
            )}
            {incompatibleBrowserModal.render && (
                <AssistantIncompatibleBrowserModal modalProps={incompatibleBrowserModal.modalProps} />
            )}
        </ComposerAssistantContext.Provider>
    );
};
