import { createContext, ReactNode, useCallback, useContext, useLayoutEffect, useState } from 'react';
import { noop } from '@proton/shared/lib/helpers/function';

const ModalPositionsContext = createContext<[any[], (id: any) => () => void]>([[], () => noop]);

export const ModalPositionsProvider = ({ children }: { children: ReactNode }) => {
    const [modals, setModals] = useState<any[]>([]);

    const addModal = useCallback((id) => {
        setModals((oldModals) => [id, ...oldModals]);
        return () => {
            setModals((oldModals) =>
                oldModals.filter((otherId) => {
                    return id !== otherId;
                })
            );
        };
    }, []);

    return <ModalPositionsContext.Provider value={[modals, addModal]}>{children}</ModalPositionsContext.Provider>;
};

export const useModalPositions = () => {
    return useContext(ModalPositionsContext);
};

export const useModalPosition = (open: boolean): boolean => {
    const [modals, addModal] = useModalPositions();
    const [id] = useState(() => ({}));

    useLayoutEffect(() => {
        if (!open) {
            return;
        }
        const removeModal = addModal(id);
        return () => {
            removeModal();
        };
    }, [open]);

    return modals[0] === id;
};
