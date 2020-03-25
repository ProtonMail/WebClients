import React, { useEffect } from 'react';
import CalendarContainerViewBlurred from '../calendar/CalendarContainerViewBlurred';
import { useModals } from 'react-components';
import FreeModal from './FreeModal';

const FreeContainer = () => {
    const { createModal } = useModals();

    useEffect(() => {
        createModal(<FreeModal />);
    }, []);

    return <CalendarContainerViewBlurred />;
};

export default FreeContainer;
