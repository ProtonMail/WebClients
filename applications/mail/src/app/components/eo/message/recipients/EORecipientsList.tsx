import { Recipient } from '@proton/shared/lib/interfaces';
import { recipientsToRecipientOrGroup } from '../../../../helpers/addresses';
import RecipientsList from '../../../message/recipients/RecipientsList';

interface Props {
    list: Recipient[];
    isLoading: boolean;
    showDropdown?: boolean;
}

const EORecipientsList = ({ list, isLoading, showDropdown }: Props) => {
    const recipientsOrGroup = recipientsToRecipientOrGroup(list);

    return (
        <RecipientsList
            isLoading={isLoading}
            recipientsOrGroup={recipientsOrGroup}
            showDropdown={showDropdown}
            isOutside
        />
    );
};

export default EORecipientsList;
