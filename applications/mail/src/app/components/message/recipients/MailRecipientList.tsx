import { Recipient } from '@proton/shared/lib/interfaces';

import { MapStatusIcons } from '../../../models/crypto';
import RecipientsList from './RecipientsList';
import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';

interface Props {
    list: Recipient[];
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
    showDropdown?: boolean;
    isPrintModal?: boolean;
}

const MailRecipientList = ({ list, mapStatusIcons, isLoading, showDropdown, isPrintModal }: Props) => {
    const { getRecipientsOrGroups } = useRecipientLabel();

    const recipientsOrGroup = getRecipientsOrGroups(list);

    return (
        <RecipientsList
            mapStatusIcons={mapStatusIcons}
            isLoading={isLoading}
            recipientsOrGroup={recipientsOrGroup}
            showDropdown={showDropdown}
            isPrintModal={isPrintModal}
        />
    );
};

export default MailRecipientList;
