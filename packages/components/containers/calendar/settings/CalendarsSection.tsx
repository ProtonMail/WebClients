import { MAX_CALENDARS_PER_FREE_USER, MAX_CALENDARS_PER_USER } from 'proton-shared/lib/calendar/constants';
import React, { useState } from 'react';
import { c } from 'ttag';
import { updateCalendarUserSettings, removeCalendar } from 'proton-shared/lib/api/calendars';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { Address, UserModel } from 'proton-shared/lib/interfaces';

import { useApi, useEventManager, useModals, useNotifications } from '../../../hooks';
import { AppLink, Card, Alert, ConfirmModal, ButtonLike, ErrorButton, PrimaryButton } from '../../../components';

import { SettingsParagraph, SettingsSection } from '../../account';

import CalendarsTable from './CalendarsTable';
import { CalendarModal } from '../calendarModal';

interface Props {
    activeAddresses: Address[];
    calendars: Calendar[];
    disabledCalendars: Calendar[];
    activeCalendars: Calendar[];
    defaultCalendar?: Calendar;
    user: UserModel;
}
const CalendarsSection = ({
    activeAddresses,
    calendars,
    defaultCalendar,
    disabledCalendars,
    activeCalendars,
    user,
}: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [loadingMap, setLoadingMap] = useState({});

    const defaultCalendarID = defaultCalendar ? defaultCalendar.ID : undefined;
    const hasDisabledCalendar = disabledCalendars.length > 0;

    const handleCreate = () => {
        createModal(<CalendarModal activeCalendars={activeCalendars} defaultCalendarID={defaultCalendarID} />);
    };

    const handleEdit = (calendar: Calendar) => {
        createModal(<CalendarModal calendar={calendar} />);
    };

    const handleSetDefault = async (calendarID: string) => {
        try {
            setLoadingMap((old) => ({ ...old, [calendarID]: true }));
            await api(updateCalendarUserSettings({ DefaultCalendarID: calendarID }));
            await call();
            createNotification({ text: c('Success').t`Default calendar updated` });
        } finally {
            setLoadingMap((old) => ({ ...old, [calendarID]: false }));
        }
    };

    const handleDelete = async ({ ID }: Calendar) => {
        const isDeleteDefaultCalendar = ID === defaultCalendarID;
        const firstRemainingCalendar = activeCalendars.find(({ ID: calendarID }) => calendarID !== ID);

        // If deleting the default calendar, the new calendar to make default is either the first active calendar or null if there is none.
        const newDefaultCalendarID = isDeleteDefaultCalendar
            ? (firstRemainingCalendar && firstRemainingCalendar.ID) || null
            : undefined;

        await new Promise<void>((resolve, reject) => {
            const calendarName = firstRemainingCalendar ? (
                <span key="calendar-name" className="text-break">
                    {firstRemainingCalendar.Name}
                </span>
            ) : (
                ''
            );
            createModal(
                <ConfirmModal
                    title={c('Title').t`Delete calendar`}
                    confirm={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
                    onClose={reject}
                    onConfirm={resolve}
                >
                    <Alert type="error">{c('Info').t`Are you sure you want to delete this calendar?`}</Alert>
                    {isDeleteDefaultCalendar && firstRemainingCalendar && (
                        <Alert type="warning">{c('Info').jt`${calendarName} will be set as default calendar.`}</Alert>
                    )}
                </ConfirmModal>
            );
        });
        try {
            setLoadingMap((old) => ({
                ...old,
                [newDefaultCalendarID || '']: true,
                [ID]: true,
            }));
            await api(removeCalendar(ID));
            // null is a valid default calendar id
            if (newDefaultCalendarID !== undefined) {
                await api(updateCalendarUserSettings({ DefaultCalendarID: newDefaultCalendarID }));
            }
            await call();
            createNotification({ text: c('Success').t`Calendar removed` });
        } finally {
            setLoadingMap((old) => ({ ...old, [newDefaultCalendarID || '']: false, [ID]: false }));
        }
    };

    const calendarLimit = user.isFree ? MAX_CALENDARS_PER_FREE_USER : MAX_CALENDARS_PER_USER;
    const isBelowLimit = calendars.length < calendarLimit;
    const canAddCalendar = activeAddresses.length > 0 && isBelowLimit && !user.isDelinquent;

    return (
        <SettingsSection>
            {user.isFree && !canAddCalendar && (
                <Card className="mb1">
                    <div className="flex flex-nowrap flex-align-items-center">
                        <p className="flex-item-fluid mt0 mb0 pr2">
                            {c('Upgrade notice')
                                .t`Upgrade to a paid plan to create up to 25 calendars, allowing you to make calendars for work, to share with friends, and just for yourself.`}
                        </p>
                        <ButtonLike as={AppLink} to="/subscription" color="norm" shape="solid" size="small">
                            {c('Action').t`Upgrade`}
                        </ButtonLike>
                    </div>
                </Card>
            )}
            <div className="mb1">
                <PrimaryButton
                    data-test-id="calendar-setting-page:add-calendar"
                    disabled={!canAddCalendar}
                    onClick={handleCreate}
                >
                    {c('Action').t`Add calendar`}
                </PrimaryButton>
            </div>
            {hasDisabledCalendar ? (
                <SettingsParagraph>
                    {c('Disabled calendar')
                        .t`A calendar is marked as disabled when it is linked to a disabled email address. You can still access your disabled calendar and view events in read-only mode or delete them. You can enable the calendar by re-enabling the email address.`}
                </SettingsParagraph>
            ) : null}
            <CalendarsTable
                calendars={calendars}
                defaultCalendarID={defaultCalendarID}
                user={user}
                onEdit={handleEdit}
                onSetDefault={handleSetDefault}
                onDelete={handleDelete}
                loadingMap={loadingMap}
            />
        </SettingsSection>
    );
};

export default CalendarsSection;
