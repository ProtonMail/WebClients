import type { ReactNode, RefObject } from 'react';
import React, { createContext, useContext, useMemo } from 'react';

import { useModalStateObject, useModalTwoPromise } from '@proton/components/components';
import { AssistantIncompatibleBrowserModal, AssistantIncompatibleHardwareModal } from '@proton/components/containers';
import useAssistantTelemetry, { INCOMPATIBILITY_TYPE } from '@proton/components/containers/llm/useAssistantTelemetry';

import type { ComposerAssistantInitialSetupSpotlightRef } from '../spotlights/ComposerAssistantInitialSetupSpotlight';

interface Manager<TElement> {
    get: (composerID: string) => RefObject<TElement>;
    set: (composerID: string, ref: RefObject<TElement>) => void;
    delete: (composerID: string) => void;
}

interface ComposerAssistantContextType {
    /**
     * Display a modal to the user.
     */
    displayAssistantModal: (modalType: 'incompatibleHardware' | 'incompatibleBrowser') => void;
    /**
     * Display a modal and wait for the user to resolve or reject it.
     */
    displayAssistantModalPromise: (modalType: 'incompatibleHardware' | 'incompatibleBrowser') => Promise<void>;
    /** Manage different kind of Assistant needed refs */
    assistantRefManager: {
        input: Manager<HTMLTextAreaElement>;
        container: Manager<HTMLDivElement>;
        composerSpotlight: Manager<ComposerAssistantInitialSetupSpotlightRef>;
    };
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
    const [hardwareModalPromise, showHardwareModalPromise] = useModalTwoPromise();
    const [browserModalPromise, showBrowserModalPromise] = useModalTwoPromise();
    const { sendIncompatibleAssistantReport } = useAssistantTelemetry();

    const displayAssistantModal = (modalType: 'incompatibleHardware' | 'incompatibleBrowser') => {
        if (modalType === 'incompatibleHardware') {
            incompatibleHardwareModal.openModal(true);
            sendIncompatibleAssistantReport({ incompatibilityType: INCOMPATIBILITY_TYPE.HARDWARE });
        }

        if (modalType === 'incompatibleBrowser') {
            incompatibleBrowserModal.openModal(true);
            sendIncompatibleAssistantReport({ incompatibilityType: INCOMPATIBILITY_TYPE.BROWSER });
        }
    };

    const displayAssistantModalPromise = async (modalType: 'incompatibleHardware' | 'incompatibleBrowser') => {
        if (modalType === 'incompatibleHardware') {
            await showHardwareModalPromise();
        }

        if (modalType === 'incompatibleBrowser') {
            await showBrowserModalPromise();
        }
    };

    const assistantRefManager = useMemo(() => {
        const assistantInputs: Record<string, RefObject<HTMLTextAreaElement>> = {};
        const assistantContainers: Record<string, RefObject<HTMLDivElement>> = {};
        const assistantComposerSpotlightRefs: Record<string, RefObject<ComposerAssistantInitialSetupSpotlightRef>> = {};
        const managerFactory = <TElement extends unknown>(
            store: Record<string, RefObject<TElement>>
        ): Manager<TElement> => ({
            get: (composerID: string) => store[composerID],
            set: (composerID: string, ref: RefObject<TElement>) => {
                store[composerID] = ref;
            },
            delete: (composerID: string) => {
                delete store[composerID];
            },
        });

        return {
            input: managerFactory(assistantInputs),
            container: managerFactory(assistantContainers),
            composerSpotlight: managerFactory(assistantComposerSpotlightRefs),
        };
    }, []);

    return (
        <ComposerAssistantContext.Provider
            value={{ displayAssistantModal, assistantRefManager, displayAssistantModalPromise }}
        >
            {children}
            {incompatibleHardwareModal.render && (
                <AssistantIncompatibleHardwareModal modalProps={incompatibleHardwareModal.modalProps} />
            )}
            {incompatibleBrowserModal.render && (
                <AssistantIncompatibleBrowserModal modalProps={incompatibleBrowserModal.modalProps} />
            )}
            {hardwareModalPromise((props) => (
                <AssistantIncompatibleHardwareModal
                    modalProps={props}
                    onResolve={props.onResolve}
                    onReject={props.onReject}
                />
            ))}
            {browserModalPromise((props) => (
                <AssistantIncompatibleBrowserModal
                    modalProps={props}
                    onResolve={props.onResolve}
                    onReject={props.onReject}
                />
            ))}
        </ComposerAssistantContext.Provider>
    );
};
