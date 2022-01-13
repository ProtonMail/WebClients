import { Recipient } from '@proton/shared/lib/interfaces';
import { recipientsToRecipientOrGroup } from '../../../../helpers/addresses';
import RecipientsList from '../../../message/recipients/RecipientsList';

interface Props {
    list: Recipient[];
    isLoading: boolean;
}

const EORecipientsList = ({ list, isLoading }: Props) => {
    const recipientsOrGroup = recipientsToRecipientOrGroup(list);

    return <RecipientsList isLoading={isLoading} recipientsOrGroup={recipientsOrGroup} isOutside />;
};

export default EORecipientsList;
