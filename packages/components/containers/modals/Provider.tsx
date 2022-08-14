import { ReactNode, useMemo, useState } from 'react';

import { ModalPositionsProvider } from '../../components/modalTwo/modalPositions';
import ModalsChildrenContext from './childrenContext';
import { Modal } from './interface';
import createManager from './manager';
import ModalsContext from './modalsContext';

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
