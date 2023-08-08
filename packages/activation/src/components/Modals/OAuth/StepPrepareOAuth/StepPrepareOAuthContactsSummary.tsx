import { c } from 'ttag';

import { selectOauthImportStateImporterData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';

interface Props {
    isSelected: boolean;
}

const StepPrepareContactsSummary = ({ isSelected }: Props) => {
    const importerData = useEasySwitchSelector(selectOauthImportStateImporterData);
    const { contacts } = importerData!;

    // Don't display anything if Contact isn't selected or if there is no data
    if (!isSelected || contacts === undefined) {
        return null;
    }

    return (
        <span className="color-weak" data-testid="StepPrepareContactsSummary:summary">{c('Info')
            .t`All your contacts will be imported, up to a limit of 10,000`}</span>
    );
};

export default StepPrepareContactsSummary;
