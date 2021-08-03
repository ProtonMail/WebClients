import { c } from 'ttag';

import { IMPORT_CALENDAR_FAQ_URL, CALENDAR_APP_NAME } from '@proton/shared/lib/calendar/constants';
import { ImportCalendarModel } from '@proton/shared/lib/interfaces/calendar/Import';
import { Alert } from '../../../components';

import ErrorDetails from './ErrorDetails';

interface Props {
    model: ImportCalendarModel;
}

const WarningModalContent = ({ model }: Props) => {
    const eventsDiscarded = model.errors.filter((e) => e.component === 'vevent');
    const totalSupported = model.eventsParsed.length;
    const totalEventsDiscarded = eventsDiscarded.length;
    const totalEvents = totalSupported + totalEventsDiscarded;

    const learnMore = model.failure ? '' : IMPORT_CALENDAR_FAQ_URL;
    const forNow = <strong key="for-now">{c('Import calendar warning').t`for now`}</strong>;
    const summary =
        totalEventsDiscarded === totalEvents
            ? c('Import warning').t`No event can be imported. Click for details`
            : totalEventsDiscarded === 0
            ? c('Import warning').t`Part of your calendar content is not supported and will not be imported`
            : c('Import warning')
                  .t`${totalEventsDiscarded} out of ${totalEvents} events will not be imported. Click for details`;

    return (
        <>
            <Alert type="warning" learnMore={learnMore}>
                <div>{c('Import calendar warning').jt`${CALENDAR_APP_NAME} does not support ${forNow}:`}</div>
                <ul>
                    <li>{c('Import calendar warning').t`Attendees`}</li>
                    <li>{c('Import calendar warning').t`Complex recurring rules`}</li>
                    <li>{c('Import calendar warning').t`Email notifications`}</li>
                    <li>{c('Import calendar warning').t`To-do entries`}</li>
                    <li>{c('Import calendar warning').t`Journal entries`}</li>
                    <li>{c('Import calendar warning').t`Free-busy time information`}</li>
                    <li>{c('Import calendar warning').t`Unofficial or custom timezones`}</li>
                    <li>{c('Import calendar warning').t`Non-Gregorian calendars`}</li>
                </ul>
            </Alert>
            <ErrorDetails summary={summary} errors={model.errors} />
        </>
    );
};

export default WarningModalContent;
