import { CALENDAR_MODAL_TYPE } from './interface';

export const getCalendarModalSize = (type: CALENDAR_MODAL_TYPE) => {
    if (type === CALENDAR_MODAL_TYPE.VISUAL) {
        return 'small';
    }

    return 'large';
};
