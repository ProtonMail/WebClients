import React, { useEffect } from 'react';
import { useModals } from 'react-components';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';

import ResetModal from './ResetModal';

import CalendarContainerViewBlurred from '../calendar/CalendarContainerViewBlurred';

interface Props {
    calendars: Calendar[];
    onDone: () => void;
}
const ResetContainer = ({ calendars, onDone }: Props) => {
    const { createModal } = useModals();

    useEffect(() => {
        createModal(<ResetModal calendars={calendars} onExit={onDone} />);
    }, []);

    return <CalendarContainerViewBlurred />;
};

export default ResetContainer;
