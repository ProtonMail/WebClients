import { c, msgid } from 'ttag';

import { selectOauthImportStateImporterData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { MAX_CONTACTS_PER_USER } from '@proton/shared/lib/contacts/constants';

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
        <span className="color-weak" data-testid="StepPrepareContactsSummary:summary">
            {c('Info').ngettext(
                msgid`All your contacts will be imported, up to a limit of ${MAX_CONTACTS_PER_USER}`,
                `All your contacts will be imported, up to a limit of ${MAX_CONTACTS_PER_USER}`,
                MAX_CONTACTS_PER_USER
            )}
        </span>
    );
};

export default StepPrepareContactsSummary;
