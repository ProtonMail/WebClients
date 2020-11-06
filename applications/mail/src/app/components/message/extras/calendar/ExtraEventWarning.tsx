import React from 'react';
import { c } from 'ttag';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { Alert } from 'react-components';
import { EVENT_TIME_STATUS, InvitationModel } from '../../../../helpers/calendar/invite';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventWarning = ({ model }: Props) => {
    const { timeStatus, isForwardedInvitation } = model;
    if (isForwardedInvitation) {
        return (
            <Alert className="mt0-5" type="warning">
                {c('Calendar invite info').t`Your email address is not in the participants list.`}
            </Alert>
        );
    }
    if (timeStatus === EVENT_TIME_STATUS.PAST) {
        return (
            <Alert className="mt0-5" type="warning">
                {c('Calendar invite info').t`This event has already happened.`}
            </Alert>
        );
    }
    if (timeStatus === EVENT_TIME_STATUS.HAPPENING) {
        return (
            <Alert className="mt0-5" type="warning">
                {c('Calendar invite info').t`This event is currently happening.`}
            </Alert>
        );
    }
    return null;
};

export default ExtraEventWarning;
