import { RequireSome } from '@proton/shared/lib/interfaces/utils';
import { InvitationModel } from '../../../../helpers/calendar/invite';
import {
    getAttendeeSummaryText,
    getHasBeenUpdatedText,
    getOrganizerSummaryText,
} from '../../../../helpers/calendar/summary';

export const getSummaryContent = (firstLine?: string, secondLine?: string) => {
    if (!firstLine && !secondLine) {
        return null;
    }
    const content =
        firstLine && secondLine ? (
            <>
                <span>{firstLine}</span>
                <span>{secondLine}</span>
            </>
        ) : (
            <span>{firstLine || secondLine}</span>
        );

    return <div className="mt0-5 mb0-5 rounded bordered bg-weak p0-5 flex flex-column text-break">{content}</div>;
};

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
}
const ExtraEventSummary = ({ model }: Props) => {
    const { isImport, hideSummary, isOrganizerMode, isPartyCrasher } = model;
    const summaryText = isOrganizerMode ? getOrganizerSummaryText(model) : getAttendeeSummaryText(model);
    const hasBeenUpdatedText = getHasBeenUpdatedText(model);

    if (isImport || hideSummary || isPartyCrasher || !summaryText) {
        return null;
    }

    return getSummaryContent(hasBeenUpdatedText, summaryText);
};

export default ExtraEventSummary;
