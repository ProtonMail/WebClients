import { UserModel } from 'proton-shared/lib/interfaces';
import React from 'react';
import { c } from 'ttag';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { APPS } from 'proton-shared/lib/constants';

import { Alert, PrimaryButton } from '../../../components';
import { useModals } from '../../../hooks';

import { ImportModal } from '../importModal';
import { SettingsParagraph, SettingsSection } from '../../account';

const CALENDAR_APP_NAME = getAppName(APPS.PROTONCALENDAR);

interface Props {
    defaultCalendar?: Calendar;
    activeCalendars: Calendar[];
    user: UserModel;
}

const CalendarImportSection = ({ activeCalendars, defaultCalendar, user }: Props) => {
    const canImport = !!activeCalendars.length && user.hasNonDelinquentScope;
    const showAlert = !activeCalendars.length && user.hasNonDelinquentScope;
    const { createModal } = useModals();
    const handleImport = () =>
        canImport && defaultCalendar
            ? createModal(<ImportModal defaultCalendar={defaultCalendar} calendars={activeCalendars} />)
            : undefined;

    return (
        <SettingsSection>
            {showAlert ? (
                <Alert type="warning">{c('Info').t`You need to have an active calendar to import your events.`}</Alert>
            ) : null}
            <SettingsParagraph learnMoreUrl="https://protonmail.com/support/knowledge-base/import-calendar-to-protoncalendar/">
                {c('Info')
                    .t`You can import ICS files from another calendar to ${CALENDAR_APP_NAME}. This lets you quickly import one event or your entire agenda.`}
            </SettingsParagraph>
            <div>
                <PrimaryButton onClick={handleImport} disabled={!canImport}>{c('Action')
                    .t`Import calendar`}</PrimaryButton>
            </div>
        </SettingsSection>
    );
};

export default CalendarImportSection;
