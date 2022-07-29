import { ContactEditProps } from '@proton/components/containers/contacts/edit/ContactEditModal';
import { Recipient } from '@proton/shared/lib/interfaces';

import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { MapStatusIcons } from '../../../models/crypto';
import RecipientsList from './RecipientsList';

interface Props {
    list: Recipient[];
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
    showDropdown?: boolean;
    isPrintModal?: boolean;
    onContactDetails: (contactID: string) => void;
    onContactEdit: (props: ContactEditProps) => void;
}

const MailRecipientList = ({
    list,
    mapStatusIcons,
    isLoading,
    showDropdown,
    isPrintModal,
    onContactDetails,
    onContactEdit,
}: Props) => {
    const { getRecipientsOrGroups } = useRecipientLabel();

    const recipientsOrGroup = getRecipientsOrGroups(list);

    return (
        <RecipientsList
            mapStatusIcons={mapStatusIcons}
            isLoading={isLoading}
            recipientsOrGroup={recipientsOrGroup}
            showDropdown={showDropdown}
            isPrintModal={isPrintModal}
            onContactDetails={onContactDetails}
            onContactEdit={onContactEdit}
        />
    );
};

export default MailRecipientList;
