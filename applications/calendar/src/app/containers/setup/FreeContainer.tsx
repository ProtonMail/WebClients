import React, { useEffect } from 'react';
import { useModals } from 'react-components';
import CalendarContainerViewBlurred from '../calendar/CalendarContainerViewBlurred';
import FreeModal from './FreeModal';

const FreeContainer = () => {
    const { createModal } = useModals();

    useEffect(() => {
        createModal(<FreeModal />);
    }, []);

    return <CalendarContainerViewBlurred />;
};

export default FreeContainer;
