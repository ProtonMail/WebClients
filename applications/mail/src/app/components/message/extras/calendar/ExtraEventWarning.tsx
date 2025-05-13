import { c } from 'ttag';

import { Banner } from '@proton/atoms';
import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getHasRecurrenceId } from '@proton/shared/lib/calendar/vcalHelper';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import type { RequireSome } from '@proton/shared/lib/interfaces/utils';

import type { InvitationModel } from '../../../../helpers/calendar/invite';

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
                <Banner className={alertClassName} color="warning">
                    {c('Calendar invite info').t`Event refreshing is not supported for the moment`}
                </Banner>
            );
        }
        const singleAnswersNotSupported = getHasRecurrenceId(veventIcs) && !getHasRecurrenceId(invitationApi?.vevent);
        if (method === ICAL_METHOD.COUNTER) {
            return (
                <>
                    {singleAnswersNotSupported && (
                        <Banner className={alertClassName} color="warning">
                            {c('Calendar invite info')
                                .t`This answer cannot be added to ${CALENDAR_APP_NAME} as we only support answers to all events of a series for the moment`}
                        </Banner>
                    )}
                    <Banner className={alertClassName} color="warning">
                        {c('Calendar invite info').t`Event rescheduling is not supported for the moment`}
                    </Banner>
                </>
            );
        }
        if (method === ICAL_METHOD.REPLY && singleAnswersNotSupported) {
            return (
                <Banner className={alertClassName} color="warning">
                    {c('Calendar invite info')
                        .t`This answer cannot be added to ${CALENDAR_APP_NAME} as we only support answers to all events of a series for the moment`}
                </Banner>
            );
        }
    }

    if (method === ICAL_METHOD.ADD && invitationApi) {
        return (
            <Banner className={alertClassName} color="warning">
                {c('Calendar invite info').t`Adding occurrences to an event is not supported for the moment`}
            </Banner>
        );
    }

    return null;
};

export default ExtraEventWarning;
