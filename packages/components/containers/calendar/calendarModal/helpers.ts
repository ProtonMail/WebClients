import { CALENDAR_MODAL_TYPE } from '@proton/components/containers/calendar/calendarModal/interface';

export const getCalendarModalSize = (type: CALENDAR_MODAL_TYPE) => {
    if (type === CALENDAR_MODAL_TYPE.VISUAL) {
        return 'small';
    }

    return 'large';
};
