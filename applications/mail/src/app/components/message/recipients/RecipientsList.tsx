import { HighlightMetadata } from '@proton/encrypted-search';
import { MapStatusIcons } from '../../../models/crypto';
import RecipientItem from './RecipientItem';
import { RecipientOrGroup } from '../../../models/address';

interface Props {
    recipientsOrGroup: RecipientOrGroup[];
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
    highlightKeywords?: boolean;
    highlightMetadata?: HighlightMetadata;
    showDropdown?: boolean;
    isOutside?: boolean;
}

const RecipientsList = ({
    recipientsOrGroup,
    mapStatusIcons,
    isLoading,
    highlightKeywords = false,
    highlightMetadata,
    showDropdown,
    isOutside,
}: Props) => {
    return (
        <>
            {recipientsOrGroup.map((recipientOrGroup, index) => (
                <RecipientItem
                    key={index} // eslint-disable-line react/no-array-index-key
                    recipientOrGroup={recipientOrGroup}
                    mapStatusIcons={mapStatusIcons}
                    isLoading={isLoading}
                    highlightKeywords={highlightKeywords}
                    highlightMetadata={highlightMetadata}
                    showDropdown={showDropdown}
                    isOutside={isOutside}
                />
            ))}
        </>
    );
};

export default RecipientsList;
