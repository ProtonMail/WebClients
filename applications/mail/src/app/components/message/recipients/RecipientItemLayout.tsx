import { ReactNode } from 'react';
import { classnames } from '@proton/components';
import { useEncryptedSearchContext } from '../../../containers/EncryptedSearchProvider';
import { highlightNode } from '../../../helpers/encryptedSearch/esHighlight';

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

const RecipientItemLayout = ({
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
        <span
            className={classnames([
                'flex flex-align-items-center flex-nowrap message-recipient-item',
                isLoading && 'flex-item-fluid',
            ])}
            data-testid="message-header:from"
        >
            <span className="container-to container-to--item no-print">{button}</span>
            <span
                className={classnames([
                    'flex flex-align-items-center flex-nowrap text-ellipsis max-w100',
                    isLoading && 'flex-item-fluid',
                ])}
            >
                <span
                    className="flex-item-fluid message-recipient-item-label-address text-ellipsis max-w100 inline-block"
                    title={title}
                >
                    <span className={classnames(['message-recipient-item-label', isLoading && 'inline-block'])}>
                        {highlightedLabel}
                    </span>
                    {
                        ` ` /** I need a real space in source here, as everything is inline, no margin/padding to have correct ellipsis applied :-| * */
                    }
                    {showAddress && (
                        <span
                            className={classnames([
                                'message-recipient-item-address color-weak',
                                isLoading && 'inline-block',
                            ])}
                        >
                            {highlightedAddress}
                        </span>
                    )}
                </span>
                {icon}
            </span>
        </span>
    );
};

export default RecipientItemLayout;
