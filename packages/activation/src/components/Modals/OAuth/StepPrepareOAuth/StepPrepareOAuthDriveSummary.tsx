import { c } from 'ttag';

import { selectOauthImportStateImporterData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { DOCS_APP_NAME, SHEETS_APP_NAME } from '@proton/shared/lib/constants';

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
            {c('Info')
                .t`Files only (no photos, ${DOCS_APP_NAME} or ${SHEETS_APP_NAME}) - up to 100 GB total, 100,000 files, and 50 GB per file`}
        </span>
    );
};

export default StepPrepareDriveSummary;
