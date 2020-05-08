import React, { ReactNode } from 'react';
import { c } from 'ttag';
import { Alert } from 'react-components';
import { ImportCalendarModel } from '../../interfaces/Import';

import ErrorDetails from './ErrorDetails';

interface Props {
    model: ImportCalendarModel;
}

const WarningModalContent = ({ model }: Props) => {
    const totalParsed = model.eventsParsed?.length || 0;
    const totalDiscarded = model.eventsNotParsed?.length || 0;
    const totalEvents = totalParsed + totalDiscarded;
    const errors = model.eventsNotParsed?.map(({ idMessage, errorMessage }, index) => {
        const error = (
            <span key={index} className="color-global-warning">
                {errorMessage}
            </span>
        );
        const message = idMessage ? (c('Error importing event').jt`${idMessage}. ${error}` as ReactNode) : error;
        return {
            index,
            message
        };
    });

    const learnMore = model.failure ? '' : 'TODO_URL';
    const forNow = <span key="for-now" className="bold">{c('Import calendar warning').t`for now`}</span>;
    const summary =
        totalDiscarded === totalEvents
            ? c('Import warning').t`No event can be imported. Click for details`
            : c('Import warning')
                  .t`${totalDiscarded} out of ${totalEvents} events will not be imported. Click for details`;

    return (
        <>
            <Alert type="warning" learnMore={learnMore}>
                <div>{c('Import calendar warning').jt`ProtonCalendar does not support ${forNow}:`}</div>
                <ul>
                    <li>{c('Import calendar warning').t`Attendees`}</li>
                    <li>{c('Import calendar warning').t`Complex recurring rules`}</li>
                    <li>{c('Import calendar warning').t`Todo's`}</li>
                    <li>{c('Import calendar warning').t`Journals`}</li>
                    <li>{c('Import calendar warning').t`Unofficial timezones`}</li>
                    <li>{c('Import calendar warning').t`Non-Gregorian calendars`}</li>
                </ul>
            </Alert>
            <ErrorDetails summary={summary} errors={errors} />
        </>
    );
};

export default WarningModalContent;
