import type { RequireSome } from '@proton/shared/lib/interfaces/utils';

import type { InvitationModel } from '../../../../../helpers/calendar/invite';
import {
    getAttendeeSummaryText,
    getHasBeenUpdatedText,
    getOrganizerSummaryText,
} from '../../../../../helpers/calendar/summary';

export const getSummaryContent = (hasBeenUpdatedText?: string, summaryText?: string) => {
    if (!hasBeenUpdatedText && !summaryText) {
        return null;
    }
    const content =
        hasBeenUpdatedText && summaryText ? (
            <>
                <span>{hasBeenUpdatedText}</span>
                <span>{summaryText}</span>
            </>
        ) : (
            <span>{hasBeenUpdatedText || summaryText}</span>
        );

    return (
        <div data-testid="ics-widget-summary" className="my-2 rounded border bg-weak p-2 flex flex-column text-break">
            {content}
        </div>
    );
};

export interface ExtraEventSummaryProps {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventSummary = ({ model }: ExtraEventSummaryProps) => {
    const { isImport, hideSummary, isOrganizerMode } = model;
    const summaryText = isOrganizerMode ? getOrganizerSummaryText(model) : getAttendeeSummaryText(model);
    const hasBeenUpdatedText = getHasBeenUpdatedText(model);

    if (isImport || hideSummary || !summaryText) {
        return null;
    }

    return getSummaryContent(hasBeenUpdatedText, summaryText);
};

export default ExtraEventSummary;
