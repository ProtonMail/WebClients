import { ReactNode } from 'react';
import { useEncryptedSearchContext } from '../../../containers/EncryptedSearchProvider';
import { highlightNode } from '../../../helpers/encryptedSearch/esHighlight';
import RecipientItemLayout from './RecipientItemLayout';

interface Props {
    button?: ReactNode;
    label?: ReactNode;
    showAddress?: boolean;
    address?: ReactNode;
    title?: string;
    icon?: ReactNode;
    isLoading?: boolean;
    highlightKeywords?: boolean;
}

const MailRecipientItem = ({
    button,
    label,
    showAddress = true,
    address,
    title,
    icon,
    isLoading = false,
    highlightKeywords = false,
}: Props) => {
    const { highlightMetadata } = useEncryptedSearchContext();
    const highlightedLabel = !!label && highlightKeywords ? highlightNode(label, highlightMetadata) : label;
    const highlightedAddress = !!address && highlightKeywords ? highlightNode(address, highlightMetadata) : address;

    return (
        <RecipientItemLayout
            button={button}
            label={highlightedLabel}
            showAddress={showAddress}
            address={highlightedAddress}
            title={title}
            icon={icon}
            isLoading={isLoading}
        />
    );
};

export default MailRecipientItem;
