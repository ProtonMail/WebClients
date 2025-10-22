import { c } from 'ttag';

import { CalendarLogo } from '@proton/components/index';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';

import { RedirectToCalendar } from './RedirectToCalendar';

export const BookingsHeader = () => {
    return (
        <div className="border-bottom flex items-center justify-space-between px-4 py-3 w-full">
            <CalendarLogo />
            <RedirectToCalendar>{c('Action').t`Join ${CALENDAR_APP_NAME}`}</RedirectToCalendar>
        </div>
    );
};
