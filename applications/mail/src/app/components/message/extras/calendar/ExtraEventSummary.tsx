import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import React from 'react';
import { InvitationModel } from '../../../../helpers/calendar/invite';
import ExtraEventAttendeeSummary from './ExtraEventAttendeeSummary';
import ExtraEventOrganizerSummary from './ExtraEventOrganizerSummary';

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventSummary = ({ model }: Props) => {
    const { hideSummary, isOrganizerMode } = model;
    if (hideSummary) {
        return null;
    }

    return isOrganizerMode ? <ExtraEventOrganizerSummary model={model} /> : <ExtraEventAttendeeSummary model={model} />;
};

export default ExtraEventSummary;
