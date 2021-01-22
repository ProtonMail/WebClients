import React, { MutableRefObject } from 'react';
import { c } from 'ttag';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { Alert, PrimaryButton, useModals } from 'react-components';

import { CalendarsEventsCache } from '../../calendar/eventStore/interface';
import ImportModal from '../../../components/import/ImportModal';

interface Props {
    defaultCalendar?: Calendar;
    activeCalendars: Calendar[];
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
}

const ImportSection = ({ activeCalendars, defaultCalendar, calendarsEventsCacheRef }: Props) => {
    const canImport = !!activeCalendars.length;
    const { createModal } = useModals();
    const handleImport = () =>
        canImport && defaultCalendar
            ? createModal(
                  <ImportModal
                      defaultCalendar={defaultCalendar}
                      calendars={activeCalendars}
                      calendarsEventsCacheRef={calendarsEventsCacheRef}
                  />
              )
            : undefined;

    return (
        <>
            {canImport ? null : (
                <Alert type="warning">{c('Info').t`You need to have an active calendar to import your events.`}</Alert>
            )}
            <Alert learnMore="https://protonmail.com/support/knowledge-base/import-calendar-to-protoncalendar/">{c(
                'Info'
            )
                .t`You can import ICS files from another calendar to ProtonCalendar. This lets you quickly import one event or your entire agenda.`}</Alert>
            <div>
                <PrimaryButton onClick={handleImport} disabled={!canImport}>{c('Action')
                    .t`Import calendar`}</PrimaryButton>
            </div>
        </>
    );
};

export default ImportSection;
