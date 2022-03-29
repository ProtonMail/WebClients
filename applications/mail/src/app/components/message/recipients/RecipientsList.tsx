import { MapStatusIcons } from '../../../models/crypto';
import RecipientItem from './RecipientItem';
import { RecipientOrGroup } from '../../../models/address';

interface Props {
    recipientsOrGroup: RecipientOrGroup[];
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
    showDropdown?: boolean;
    isOutside?: boolean;
}

const RecipientsList = ({ recipientsOrGroup, mapStatusIcons, isLoading, showDropdown, isOutside }: Props) => {
    return (
        <>
            {recipientsOrGroup.map((recipientOrGroup, index) => (
                <RecipientItem
                    key={index} // eslint-disable-line react/no-array-index-key
                    recipientOrGroup={recipientOrGroup}
                    mapStatusIcons={mapStatusIcons}
                    isLoading={isLoading}
                    showDropdown={showDropdown}
                    isOutside={isOutside}
                    isRecipient={true}
                    isExpanded={true}
                />
            ))}
        </>
    );
};

export default RecipientsList;
