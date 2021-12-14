import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getRecipients } from '@proton/shared/lib/mail/messages';

import { useRecipientLabel } from '../../../hooks/contact/useRecipientLabel';
import { useEncryptedSearchContext } from '../../../containers/EncryptedSearchProvider';
import RecipientSimple from './RecipientSimple';

interface Props {
    message?: Message;
    isLoading?: boolean;
    highlightKeywords?: boolean;
}

const MailRecipientsSimple = ({ message, isLoading, highlightKeywords = false }: Props) => {
    const { getRecipientsOrGroups, getRecipientOrGroupLabel } = useRecipientLabel();
    const { highlightMetadata } = useEncryptedSearchContext();
    const recipients = getRecipients(message);
    const recipientsOrGroup = getRecipientsOrGroups(recipients);

    return (
        <RecipientSimple
            recipientsOrGroup={recipientsOrGroup}
            highlightKeywords={highlightKeywords}
            highlightMetadata={highlightMetadata}
            getRecipientOrGroupLabel={getRecipientOrGroupLabel}
            isLoading={isLoading}
        />
    );
};

export default MailRecipientsSimple;
