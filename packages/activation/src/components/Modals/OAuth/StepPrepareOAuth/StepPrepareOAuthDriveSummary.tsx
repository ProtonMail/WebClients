import { c } from 'ttag';

import { selectOauthImportStateImporterData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';

interface Props {
    isSelected: boolean;
}

const StepPrepareDriveSummary = ({ isSelected }: Props) => {
    const importerData = useEasySwitchSelector(selectOauthImportStateImporterData);
    const drive = importerData?.drive;

    // Don't display anything if Drive isn't selected or if there is no data
    if (!isSelected || drive === undefined) {
        return null;
    }

    return (
        <span className="color-weak" data-testid="StepPrepareDriveSummary:summary">
            {/* TODO(DRVWEB-5513): This is placeholder text - set the right text when UX/BE is finalized (e.g. 100GB limit total,
            no photos, 50Gb max per file) */}
            {c('Info').t`All your files will be imported`}
        </span>
    );
};

export default StepPrepareDriveSummary;
