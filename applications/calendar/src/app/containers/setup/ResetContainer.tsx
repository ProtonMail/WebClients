import { useEffect } from 'react';
import { useModals } from '@proton/components';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import ResetModal from './ResetModal';

import CalendarContainerViewBlurred from '../calendar/CalendarContainerViewBlurred';

interface Props {
    calendars: VisualCalendar[];
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
