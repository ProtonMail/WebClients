import { getSequence } from 'proton-shared/lib/calendar/vcalHelper';
import React from 'react';
import { c } from 'ttag';
import { Button } from 'react-components';
import { ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { InvitationModel } from '../../../../helpers/calendar/invite';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventOrganizerButtons = ({ model }: Props) => {
    const {
        invitationIcs,
        invitationIcs: { method },
        invitationApi,
    } = model;
    if (!invitationApi?.vevent.sequence) {
        return null;
    }
    const { vevent: eventIcs } = invitationIcs;
    const { vevent: eventApi } = invitationApi;
    const [sequenceApi, sequenceIcs] = [eventApi, eventIcs].map(getSequence);
    const sequenceDiff = sequenceIcs - sequenceApi;

    if (method === ICAL_METHOD.COUNTER) {
        if (sequenceDiff === 0) {
            return <Button size="small">{c('Action').t`Accept`}</Button>;
        }
        if (sequenceDiff < 0) {
            return <Button size="small" disabled>{c('Action').t`Accept`}</Button>;
        }
    }
    return null;
};

export default ExtraEventOrganizerButtons;
