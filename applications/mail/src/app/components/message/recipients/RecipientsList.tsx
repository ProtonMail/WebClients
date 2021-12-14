import { MapStatusIcons } from '../../../models/crypto';
import RecipientItem from './RecipientItem';
import { RecipientOrGroup } from '../../../models/address';

interface Props {
    mapStatusIcons?: MapStatusIcons;
    isLoading: boolean;
    highlightKeywords?: boolean;
    recipientsOrGroup: RecipientOrGroup[];
    isOutside?: boolean;
}

const RecipientsList = ({ recipientsOrGroup, mapStatusIcons, isLoading, highlightKeywords = false, isOutside= false }: Props) => {
    return (
        <>
            {recipientsOrGroup.map((recipientOrGroup, index) => (
                <RecipientItem
                    key={index} // eslint-disable-line react/no-array-index-key
                    recipientOrGroup={recipientOrGroup}
                    mapStatusIcons={mapStatusIcons}
                    isLoading={isLoading}
                    highlightKeywords={highlightKeywords}
                    isOutside={isOutside}
                />
            ))}
        </>
    );
};

export default RecipientsList;
