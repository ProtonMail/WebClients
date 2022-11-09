import { ImportModal } from '@proton/components/containers/calendar/importModal';
import { useCalendarUserSettings } from '@proton/components/hooks';
import {
    DEFAULT_CALENDAR_USER_SETTINGS as DEFAULT_SETTINGS,
    getDefaultCalendar,
} from '@proton/shared/lib/calendar/calendar';

import useUserCalendars from './useUserCalendars';

interface Props {
    onClose: () => void;
}

const CalendarModal = ({ onClose }: Props) => {
    const [userActiveCalendars, loading] = useUserCalendars();
    const [settings = DEFAULT_SETTINGS, loadingSettings] = useCalendarUserSettings();

    const defaultCalendar = getDefaultCalendar(userActiveCalendars, settings.DefaultCalendarID);

    if (loading || loadingSettings) {
        return null;
    }

    return (
        <ImportModal
            key={'calendar-import-modal'}
            isOpen
            onClose={onClose}
            defaultCalendar={defaultCalendar!}
            calendars={userActiveCalendars}
        />
    );
};

export default CalendarModal;
