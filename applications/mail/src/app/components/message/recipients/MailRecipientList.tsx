import type { ContactEditProps } from '@proton/components';
import type { Recipient } from '@proton/shared/lib/interfaces';

import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import type { MapStatusIcons } from '../../../models/crypto';
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

    /* Recipient "item" can be displayed in several ways
     * - As a contact group: If recipients are included in a contact group (recipient.Group is filled), we display the contact group, and not the recipient
     * - As a real recipient
     *      - When contact has no group set
     *      - In print modal, we want to display recipients, not contact group
     */
    const recipientsOrGroup = getRecipientsOrGroups(list, isPrintModal);

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
