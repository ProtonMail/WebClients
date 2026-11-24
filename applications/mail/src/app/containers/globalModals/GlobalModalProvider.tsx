import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';

import { GlobalModalContext } from './globalModalContext';
import type { GlobalModal, ModalPayload } from './inteface';
import { ModalType } from './inteface';

// Each modal is only downloaded and mounted when it is opened
const GlobalScheduleModal = lazy(() =>
    import(/* webpackChunkName: "global-schedule-modal" */ './GlobalScheduleModal').then((m) => ({
        default: m.GlobalScheduleModal,
    }))
);
const GlobalSnoozeModal = lazy(() =>
    import(/* webpackChunkName: "global-snooze-modal" */ './GlobalSnoozeModal').then((m) => ({
        default: m.GlobalSnoozeModal,
    }))
);
const GlobalUnsubscribeModal = lazy(() =>
    import(/* webpackChunkName: "global-unsubscribe-modal" */ './GlobalUnsubscribeModal').then((m) => ({
        default: m.GlobalUnsubscribeModal,
    }))
);
const GlobalCategoriesB2BOnboarding = lazy(() =>
    import(/* webpackChunkName: "global-categories-b2b-onboarding" */ './GlobalCategoriesB2BOnboarding').then((m) => ({
        default: m.GlobalCategoriesB2BOnboarding,
    }))
);
const GlobalCategoriesB2COnboarding = lazy(() =>
    import(/* webpackChunkName: "global-categories-b2c-onboarding" */ './GlobalCategoriesB2COnboarding').then((m) => ({
        default: m.GlobalCategoriesB2COnboarding,
    }))
);
const GlobalBYOESpotlightModal = lazy(() =>
    import(/* webpackChunkName: "global-byoe-spotlight-modal" */ './GlobalBYOESpotlightModal').then((m) => ({
        default: m.GlobalBYOESpotlightModal,
    }))
);

interface ActiveModal {
    // A new id for every opening, so a modal opened again starts from a clean state
    id: number;
    payload: ModalPayload;
}

const renderModal = (payload: ModalPayload, modalProps: ModalStateProps) => {
    switch (payload.type) {
        case ModalType.Schedule:
            return <GlobalScheduleModal value={payload.value} modalProps={modalProps} />;
        case ModalType.Snooze:
            return <GlobalSnoozeModal value={payload.value} modalProps={modalProps} />;
        case ModalType.Unsubscribe:
            return <GlobalUnsubscribeModal value={payload.value} modalProps={modalProps} />;
        case ModalType.CategoriesViewB2BOnboarding:
            return <GlobalCategoriesB2BOnboarding value={payload.value} modalProps={modalProps} />;
        case ModalType.CategoriesViewB2COnboarding:
            return <GlobalCategoriesB2COnboarding value={payload.value} modalProps={modalProps} />;
        case ModalType.BYOESpotlight:
            return <GlobalBYOESpotlightModal value={payload.value} modalProps={modalProps} />;
    }
};

export const GlobalModalProvider = ({ children }: { children: React.ReactNode }) => {
    // Modals are shown one after the other, in the order they were requested
    const [queue, setQueue] = useState<ActiveModal[]>([]);
    const nextIdRef = useRef(0);
    const active = queue[0];
    // The provider owns the open state, the modals only render what they are given
    const [modalProps, setOpen, shouldRender] = useModalState({
        onExit: () => setQueue((current) => current.slice(1)),
    });

    // `notify` never changes, so the components calling it don't re-render when a modal opens or closes
    const notify = useCallback((payload: ModalPayload) => {
        nextIdRef.current += 1;
        const id = nextIdRef.current;
        setQueue((current) => [...current, { id, payload }]);
    }, []);

    // Opens the first modal of the queue, and the next one each time a modal is gone
    useEffect(() => {
        if (active && !shouldRender) {
            setOpen(true);
        }
    }, [active, shouldRender, setOpen]);

    const value: GlobalModal = useMemo(() => ({ notify }), [notify]);

    // A modal that fails to load (offline, outdated chunk after a deploy) is reported and dropped, not shown as a crash
    const handleError = () => {
        modalProps.onClose();
        modalProps.onExit();
    };

    return (
        <GlobalModalContext.Provider value={value}>
            {children}
            {shouldRender && active && (
                <ErrorBoundary key={active.id} component={null} onError={handleError}>
                    <Suspense fallback={null}>{renderModal(active.payload, modalProps)}</Suspense>
                </ErrorBoundary>
            )}
        </GlobalModalContext.Provider>
    );
};
