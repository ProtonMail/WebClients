import { Recipient } from '@proton/shared/lib/interfaces';
import RecipientsList from 'proton-mail/src/app/components/message/recipients/RecipientsList';
import { recipientsToRecipientOrGroup } from 'proton-mail/src/app/helpers/addresses';

interface Props {
    list: Recipient[];
    isLoading: boolean;
}

const EORecipientsList = ({list, isLoading}: Props) => {
    const recipientsOrGroup = recipientsToRecipientOrGroup(list);

    return (
        <RecipientsList
            isLoading={isLoading}
            recipientsOrGroup={recipientsOrGroup}
            isOutside
        />
    );
};

export default EORecipientsList;
