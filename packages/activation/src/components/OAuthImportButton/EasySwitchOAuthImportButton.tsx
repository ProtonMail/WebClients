import { c } from 'ttag';

import type { EASY_SWITCH_SOURCES } from '../../interface';
import { ImportProvider, ImportType } from '../../interface';
import { useProductSelectionSubmit } from '../Modals/ProductSelectionModal/useProductSelectionSubmit';
import GoogleButton from './GoogleButton';
import GoogleDriveButton from './GoogleDriveButton';
import OutlookButton from './OutlookButton';

type AllowedImporter = ImportProvider.GOOGLE | ImportProvider.OUTLOOK;
interface Props {
    className?: string;
    source: EASY_SWITCH_SOURCES;
    products: ImportType[];
    onClick?: () => void;
    provider: AllowedImporter;
    isDropdownButton?: boolean;
    disabled?: boolean;
}

const EasySwitchOauthImportButton = ({
    className,
    provider,
    products,
    source,
    onClick,
    isDropdownButton,
    disabled,
}: Props) => {
    const { handleSubmit } = useProductSelectionSubmit();

    const handleClick = () => {
        handleSubmit(provider, products, source);
        onClick?.();
    };

    if (provider === ImportProvider.GOOGLE) {
        if (products.length === 1 && products[0] === ImportType.DRIVE) {
            return <GoogleDriveButton className={className} onClick={handleClick} disabled={disabled} />;
        }

        return (
            <GoogleButton
                className={className}
                onClick={handleClick}
                label={c('Action').t`Import from Google`}
                isDropdownButton={isDropdownButton}
            />
        );
    }

    if (provider === ImportProvider.OUTLOOK) {
        return (
            <OutlookButton
                className={className}
                onClick={handleClick}
                label={c('Action').t`Import from Outlook`}
                isDropdownButton={isDropdownButton}
            />
        );
    }

    return null;
};

export default EasySwitchOauthImportButton;
