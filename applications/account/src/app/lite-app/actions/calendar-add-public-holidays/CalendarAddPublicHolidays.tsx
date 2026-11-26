import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { useGetHolidaysDirectory } from '@proton/calendar/holidaysDirectory/hooks';
import GenericError from '@proton/components/containers/error/GenericError';
import { getIsHolidaysCalendar, getVisualCalendars } from '@proton/shared/lib/calendar/calendar';
import {
    getCalendarsLimitReachedText,
    getHasUserReachedCalendarsLimit,
} from '@proton/shared/lib/calendar/calendarLimits';
import type { HolidaysDirectoryCalendar } from '@proton/shared/lib/interfaces/calendar/Calendar';

import broadcast, { MessageType } from '../../broadcast';
import LiteSettingsPage from '../../components/settings/LiteSettingsPage';
import LiteSettingsSheet from '../../components/settings/LiteSettingsSheet';
import AddPublicHolidaysForm from './AddPublicHolidaysForm';

import './CalendarAddPublicHolidays.scss';

interface Props {
    layout: (children: ReactNode, props?: any) => ReactNode;
    loader: ReactNode;
}

const handleAdded = () => {
    broadcast({ type: MessageType.SUCCESS });
};

const handleCancel = () => {
    broadcast({ type: MessageType.CLOSE });
};

/** Adds a public holidays calendar, for the NGC mobile apps */
const CalendarAddPublicHolidays = ({ layout, loader }: Props) => {
    const getHolidaysDirectory = useGetHolidaysDirectory();
    const [calendars, loadingCalendars] = useCalendars();
    const [user, loadingUser] = useUser();
    const [calendarUserSettings, loadingCalendarUserSettings] = useCalendarUserSettings();
    const [directory, setDirectory] = useState<HolidaysDirectoryCalendar[]>();
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        getHolidaysDirectory()
            .then(setDirectory)
            .catch(() => setHasError(true));
    }, []);

    const renderPage = (sheet: ReactNode) => {
        return layout(<LiteSettingsPage>{sheet}</LiteSettingsPage>, { className: 'overflow-auto' });
    };

    if (hasError) {
        return renderPage(
            <LiteSettingsSheet onCancel={handleCancel}>
                <GenericError />
            </LiteSettingsSheet>
        );
    }

    if (
        !directory ||
        loadingCalendars ||
        !calendars ||
        loadingUser ||
        !user ||
        loadingCalendarUserSettings ||
        !calendarUserSettings
    ) {
        return loader;
    }

    const visualCalendars = getVisualCalendars(calendars);

    if (getHasUserReachedCalendarsLimit(visualCalendars, user.isFree).isOtherCalendarsLimitReached) {
        return renderPage(
            <LiteSettingsSheet
                description={getCalendarsLimitReachedText(user.isFree).combinedText}
                onCancel={handleCancel}
            />
        );
    }

    return renderPage(
        <AddPublicHolidaysForm
            directory={directory}
            holidaysCalendars={visualCalendars.filter(getIsHolidaysCalendar)}
            onAdded={handleAdded}
            onCancel={handleCancel}
            onError={() => setHasError(true)}
        />
    );
};

export default CalendarAddPublicHolidays;
