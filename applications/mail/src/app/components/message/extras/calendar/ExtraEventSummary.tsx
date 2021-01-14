import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import React, { ReactNode } from 'react';
import { InvitationModel } from '../../../../helpers/calendar/invite';
import ExtraEventAttendeeSummary from './ExtraEventAttendeeSummary';
import ExtraEventOrganizerSummary from './ExtraEventOrganizerSummary';

export const getSummaryParagraph = (text: ReactNode) => {
    return <p className="mt0-5 mb0-5">{text}</p>;
};

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventSummary = ({ model }: Props) => {
    const { hideSummary, isOrganizerMode, isPartyCrasher } = model;
    if (hideSummary || isPartyCrasher) {
        return null;
    }

    return isOrganizerMode ? <ExtraEventOrganizerSummary model={model} /> : <ExtraEventAttendeeSummary model={model} />;
};

export default ExtraEventSummary;
