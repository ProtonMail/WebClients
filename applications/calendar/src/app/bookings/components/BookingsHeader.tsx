import { CalendarLogo } from '@proton/components/index';

import { RedirectToCalendarButton } from './RedirectToCalendar';

export const BookingsHeader = () => {
    return (
        <div className="border-bottom flex items-center justify-space-between px-4 py-3 w-full">
            <CalendarLogo />
            <RedirectToCalendarButton />
        </div>
    );
};
