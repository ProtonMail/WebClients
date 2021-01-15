import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import React, { ReactNode } from 'react';
import { InvitationModel } from '../../../../helpers/calendar/invite';
import {
    getAttendeeSummaryText,
    getHasBeenUpdatedText,
    getOrganizerSummaryText,
} from '../../../../helpers/calendar/summary';

export const getSummaryParagraph = (text: ReactNode) => {
    return <p className="mt0-5 mb0-5">{text}</p>;
};

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventSummary = ({ model }: Props) => {
    const { hideSummary, isOrganizerMode, isPartyCrasher } = model;
    const summaryText = isOrganizerMode ? getOrganizerSummaryText(model) : getAttendeeSummaryText(model);
    const hasBeenUpdatedText = getHasBeenUpdatedText(model);

    if (hideSummary || isPartyCrasher || !summaryText) {
        return null;
    }

    if (hasBeenUpdatedText) {
        return (
            <>
                {getSummaryParagraph(hasBeenUpdatedText)}
                {getSummaryParagraph(summaryText)}
            </>
        );
    }

    return getSummaryParagraph(summaryText);
};

export default ExtraEventSummary;
