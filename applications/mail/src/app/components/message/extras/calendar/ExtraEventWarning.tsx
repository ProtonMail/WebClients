import { c } from 'ttag';



import { Alert } from '@proton/components';
import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { RequireSome } from '@proton/shared/lib/interfaces/utils';



import { InvitationModel } from '../../../../helpers/calendar/invite';


interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventWarning = ({ model }: Props) => {
    const {
        isOrganizerMode,
        invitationIcs: { method, vevent: veventIcs },
        invitationApi,
        hasDecryptionError,
        isOutdated,
        isFromFuture,
    } = model;

    const alertClassName = 'my-2 text-break';

    if ((isOutdated || isFromFuture) && method !== ICAL_METHOD.REFRESH) {
        return null;
    }

    if (isOrganizerMode) {
        if (!invitationApi && !hasDecryptionError) {
            return null;
        }
        if (method === ICAL_METHOD.REFRESH) {
            return (
                <Alert className={alertClassName} type="warning">
                    {c('Calendar invite info').t`Event refreshing is not supported for the moment`}
                </Alert>
            );
        }
        if (method === ICAL_METHOD.COUNTER) {
            return (
                <>
                    {veventIcs['recurrence-id'] && (
                        <Alert className={alertClassName} type="warning">
                            {c('Calendar invite info')
                                .t`This answer cannot be added to ${CALENDAR_APP_NAME} as we only support answers to all events of a series for the moment`}
                        </Alert>
                    )}
                    <Alert className={alertClassName} type="warning">
                        {c('Calendar invite info').t`Event rescheduling is not supported for the moment`}
                    </Alert>
                </>
            );
        }
        if (method === ICAL_METHOD.REPLY && veventIcs['recurrence-id']) {
            return (
                <Alert className={alertClassName} type="warning">
                    {c('Calendar invite info')
                        .t`This answer cannot be added to ${CALENDAR_APP_NAME} as we only support answers to all events of a series for the moment`}
                </Alert>
            );
        }
    }

    if (method === ICAL_METHOD.ADD && invitationApi) {
        return (
            <Alert className={alertClassName} type="warning">
                {c('Calendar invite info').t`Adding occurrences to an event is not supported for the moment`}
            </Alert>
        );
    }

    return null;
};

export default ExtraEventWarning;