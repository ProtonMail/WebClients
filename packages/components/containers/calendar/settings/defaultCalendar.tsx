import { c } from 'ttag';

import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

export const getNextDefaultCalendar = (calendar: VisualCalendar | undefined) => {
    if (!calendar) {
        return null;
    }

    const name = calendar.Name;
    const boldName = calendar ? (
        <span className="text-strong text-break" key="calendar-name">
            {name}
        </span>
    ) : null;

    return c('Info').jt`${boldName} will be set as default calendar.`;
};
