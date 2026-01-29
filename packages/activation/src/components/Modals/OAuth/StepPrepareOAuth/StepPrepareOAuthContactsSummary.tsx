import { c, msgid } from 'ttag';

import { selectOauthImportStateImporterData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { getMaxContactsImportConfig } from '@proton/unleash';

interface Props {
    isSelected: boolean;
}

const StepPrepareContactsSummary = ({ isSelected }: Props) => {
    const importerData = useEasySwitchSelector(selectOauthImportStateImporterData);
    const { contacts } = importerData!;

    const maxContact = getMaxContactsImportConfig();

    // Don't display anything if Contact isn't selected or if there is no data
    if (!isSelected || contacts === undefined) {
        return null;
    }

    return (
        <span className="color-weak" data-testid="StepPrepareContactsSummary:summary">
            {c('Info').ngettext(
                msgid`All your contacts will be imported, up to a limit of ${maxContact}`,
                `All your contacts will be imported, up to a limit of ${maxContact}`,
                maxContact
            )}
        </span>
    );
};

export default StepPrepareContactsSummary;
