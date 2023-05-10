import { ReactNode } from 'react';

import { Address, UserModel } from '@proton/shared/lib/interfaces';
import { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { SettingsSectionWide } from '../../account';
import CalendarsTable from './CalendarsTable';

export interface CalendarsSectionProps {
    calendars: (VisualCalendar | SubscribedCalendar)[];
    defaultCalendarID?: string;
    addresses: Address[];
    user: UserModel;
    children?: ReactNode;
    onSetDefault?: (id: string) => Promise<void>;
    onEdit?: (calendar: VisualCalendar) => void;
    onDelete?: (id: string) => Promise<void>;
    onExport?: (calendar: VisualCalendar) => void;
    nameHeader?: string;
}
const CalendarsSection = ({
    calendars,
    defaultCalendarID,
    addresses,
    user,
    children,
    onEdit,
    onSetDefault,
    onDelete,
    onExport,
    nameHeader,
    ...rest
}: CalendarsSectionProps) => {
    return (
        <SettingsSectionWide {...rest}>
            {children}
            {!!calendars.length && (
                <CalendarsTable
                    nameHeader={nameHeader}
                    calendars={calendars}
                    defaultCalendarID={defaultCalendarID}
                    addresses={addresses}
                    user={user}
                    onSetDefault={onSetDefault}
                />
            )}
        </SettingsSectionWide>
    );
};

export default CalendarsSection;
