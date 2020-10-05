import React from 'react';
import { c } from 'ttag';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { Alert } from 'react-components';
import { EVENT_TIME_STATUS, InvitationModel } from '../../../../helpers/calendar/invite';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventWarning = ({ model }: Props) => {
    const { timeStatus } = model;
    if (timeStatus === EVENT_TIME_STATUS.PAST) {
        return <Alert type="warning">{c('Calendar invite info').t`This event has already happened.`}</Alert>;
    }
    if (timeStatus === EVENT_TIME_STATUS.HAPPENING) {
        return <Alert type="warning">{c('Calendar invite info').t`This event is currently happening.`}</Alert>;
    }
    return null;
};

export default ExtraEventWarning;
