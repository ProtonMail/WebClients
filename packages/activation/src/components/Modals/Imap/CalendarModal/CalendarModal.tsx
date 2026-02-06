import { useCalendarUserSettings } from '@proton/calendar/useCalendarUserSettings';
import { useCalendars } from '@proton/calendar/useCalendars';
import ImportModal from '@proton/components/containers/calendar/importModal/ImportModal';
import {
    DEFAULT_CALENDAR_USER_SETTINGS as DEFAULT_SETTINGS,
    getPreferredActiveWritableCalendar,
    getVisualCalendars,
    sortCalendars,
} from '@proton/shared/lib/calendar/calendar';

interface Props {
    onClose: () => void;
}

const CalendarModal = ({ onClose }: Props) => {
    const [calendars = [], loading] = useCalendars();
    const visualCalendars = sortCalendars(getVisualCalendars(calendars));
    const [settings = DEFAULT_SETTINGS, loadingSettings] = useCalendarUserSettings();

    const defaultCalendar = getPreferredActiveWritableCalendar(visualCalendars, settings.DefaultCalendarID);

    if (loading || loadingSettings) {
        return null;
    }

    return (
        <ImportModal
            key={'calendar-import-modal'}
            isOpen
            onClose={onClose}
            initialCalendar={defaultCalendar!}
            calendars={visualCalendars}
        />
    );
};

export default CalendarModal;
