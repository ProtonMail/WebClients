import { useState, useMemo, ReactNode } from 'react';

import ModalsContext from './modalsContext';
import ModalsChildrenContext from './childrenContext';
import createManager from './manager';
import { Modal } from './interface';
import { ModalPositionsProvider } from '../../components/modalTwo/modalPositions';

interface Props {
    children: ReactNode;
}

const ModalsProvider = ({ children }: Props) => {
    const [modals, setModals] = useState<Modal[]>([]);

    const manager = useMemo(() => {
        return { ...createManager(modals, setModals), modals };
    }, [modals, setModals]);

    return (
        <ModalPositionsProvider>
            <ModalsContext.Provider value={manager}>
                <ModalsChildrenContext.Provider value={modals}>{children}</ModalsChildrenContext.Provider>
            </ModalsContext.Provider>
        </ModalPositionsProvider>
    );
};

export default ModalsProvider;
