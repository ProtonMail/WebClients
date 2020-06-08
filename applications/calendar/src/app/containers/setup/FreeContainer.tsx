import React, { useEffect } from 'react';
import { useModals } from 'react-components';
import CalendarContainerViewBlurred from '../calendar/CalendarContainerViewBlurred';
import FreeModal from './FreeModal';

const FreeContainer = () => {
    const { createModal, hideModal } = useModals();

    useEffect(() => {
        const id = createModal(<FreeModal />);
        return () => {
            hideModal(id);
        };
    }, []);

    return <CalendarContainerViewBlurred />;
};

export default FreeContainer;
