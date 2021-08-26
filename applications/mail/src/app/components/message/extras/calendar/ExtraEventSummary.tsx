import { RequireSome } from '@proton/shared/lib/interfaces/utils';
import { InvitationModel } from '../../../../helpers/calendar/invite';
import {
    getAttendeeSummaryText,
    getHasBeenUpdatedText,
    getOrganizerSummaryText,
} from '../../../../helpers/calendar/summary';

export const getSummaryParagraph = (text1?: string, text2?: string) => {
    if (!text1 && !text2) {
        return null;
    }
    const content =
        text1 && text2 ? (
            <>
                <span>{text1}</span>
                <span>{text2}</span>
            </>
        ) : (
            <span>{text1 || text2}</span>
        );

    return <div className="mt0-5 mb0-5 rounded bordered bg-weak p0-5 flex flex-column">{content}</div>;
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

    return getSummaryParagraph(hasBeenUpdatedText, summaryText);
};

export default ExtraEventSummary;
