import { c, msgid } from 'ttag';

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

    const { numContact, numGroups } = contacts;
    // Don't display anything if the number received are not numbers
    if (Number.isNaN(numContact) || Number.isNaN(numGroups)) {
        return null;
    }

    const contactsFragment = c('Info').ngettext(msgid`${numContact} contact`, `${numContact} contacts`, numContact);

    const contactsGroupsFragment = c('Info').ngettext(
        msgid`${numGroups} contact group`,
        `${numGroups} contact groups`,
        numGroups
    );

    return (
        <div className="color-weak" data-testid="StepPrepareContactsSummary:summary">{c('Info')
            .t`Import ${contactsFragment} and ${contactsGroupsFragment}`}</div>
    );
};

export default StepPrepareContactsSummary;
