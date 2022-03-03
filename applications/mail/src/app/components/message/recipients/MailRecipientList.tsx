import { Recipient } from '@proton/shared/lib/interfaces';

import { HighlightMetadata } from '@proton/encrypted-search';
import { MapStatusIcons } from '../../../models/crypto';
import RecipientsList from './RecipientsList';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';

interface Props {
    list: Recipient[];
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
    highlightKeywords?: boolean;
    highlightMetadata?: HighlightMetadata;
    showDropdown?: boolean;
}

const MailRecipientList = ({
    list,
    mapStatusIcons,
    isLoading,
    highlightMetadata,
    highlightKeywords,
    showDropdown,
}: Props) => {
    const { getRecipientsOrGroups } = useRecipientLabel();

    const recipientsOrGroup = getRecipientsOrGroups(list);

    return (
        <RecipientsList
            mapStatusIcons={mapStatusIcons}
            isLoading={isLoading}
            recipientsOrGroup={recipientsOrGroup}
            showDropdown={showDropdown}
            highlightMetadata={highlightMetadata}
            highlightKeywords={highlightKeywords}
        />
    );
};

export default MailRecipientList;
