import type { ReactNode } from 'react';

import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import type { Address, UserModel } from '@proton/shared/lib/interfaces';
import type { SubscribedCalendar, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

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
                <>
                    {nameHeader && <h4 className="lg:hidden text-bold text-rg mb-2">{nameHeader}</h4>}
                    <CalendarsTable
                        nameHeader={nameHeader}
                        calendars={calendars}
                        defaultCalendarID={defaultCalendarID}
                        addresses={addresses}
                        user={user}
                        onSetDefault={onSetDefault}
                    />
                </>
            )}
        </SettingsSectionWide>
    );
};

export default CalendarsSection;
