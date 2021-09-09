import { useState, ReactNode } from 'react';

import ModalsContext from './modalsContext';
import ModalsChildrenContext from './childrenContext';
import createManager from './manager';
import { Modal } from './interface';
import { useInstance } from '../../hooks';

interface Props {
    children: ReactNode;
}

const ModalsProvider = ({ children }: Props) => {
    const [modals, setModals] = useState<Modal[]>([]);

    const manager = useInstance(() => {
        return createManager(modals, setModals);
    });

    return (
        <ModalsContext.Provider value={manager}>
            <ModalsChildrenContext.Provider value={modals}>{children}</ModalsChildrenContext.Provider>
        </ModalsContext.Provider>
    );
};

export default ModalsProvider;
