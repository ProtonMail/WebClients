import { Recipient } from '@proton/shared/lib/interfaces/Address';

import { MapStatusIcons } from '../../../models/crypto';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import RecipientsList from './RecipientsList';

interface Props {
    list: Recipient[];
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
    highlightKeywords?: boolean;
}

const MailRecipientsList = ({ list, mapStatusIcons, isLoading, highlightKeywords = false }: Props) => {
    const { getRecipientsOrGroups } = useRecipientLabel();

    const recipientsOrGroup = getRecipientsOrGroups(list);

    return (
        <RecipientsList
            isLoading={isLoading}
            recipientsOrGroup={recipientsOrGroup}
            highlightKeywords={highlightKeywords}
            mapStatusIcons={mapStatusIcons}
        />
    );
};

export default MailRecipientsList;
