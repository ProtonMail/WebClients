import { ContactEditProps } from '@proton/components';
import { MapStatusIcons } from '../../../models/crypto';
import RecipientItem from './RecipientItem';
import { RecipientOrGroup } from '../../../models/address';

interface Props {
    recipientsOrGroup: RecipientOrGroup[];
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
    showDropdown?: boolean;
    isOutside?: boolean;
    isPrintModal?: boolean;
    onContactDetails: (contactID: string) => void;
    onContactEdit: (props: ContactEditProps) => void;
}

const RecipientsList = ({
    recipientsOrGroup,
    mapStatusIcons,
    isLoading,
    showDropdown,
    isOutside,
    isPrintModal,
    onContactDetails,
    onContactEdit,
}: Props) => {
    return (
        <>
            {recipientsOrGroup.map((recipientOrGroup, index) => (
                <>
                    <RecipientItem
                        key={index} // eslint-disable-line react/no-array-index-key
                        recipientOrGroup={recipientOrGroup}
                        mapStatusIcons={mapStatusIcons}
                        isLoading={isLoading}
                        showDropdown={showDropdown}
                        isOutside={isOutside}
                        isRecipient={true}
                        isExpanded={true}
                        onContactDetails={onContactDetails}
                        onContactEdit={onContactEdit}
                    />
                    {isPrintModal && index < recipientsOrGroup.length - 1 && <span>, </span>}
                </>
            ))}
        </>
    );
};

export default RecipientsList;
