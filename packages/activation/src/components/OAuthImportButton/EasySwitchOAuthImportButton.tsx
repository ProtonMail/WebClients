import { c } from 'ttag';

import { useProductSelectionSubmit } from '@proton/activation/src/components/Modals/ProductSelectionModal/useProductSelectionSubmit';
import type { EASY_SWITCH_SOURCES, ImportType } from '@proton/activation/src/interface';
import { ImportProvider } from '@proton/activation/src/interface';

import GoogleButton from './GoogleButton';
import OutlookButton from './OutlookButton';

type AllowedImporter = ImportProvider.GOOGLE | ImportProvider.OUTLOOK;
interface Props {
    className?: string;
    source: EASY_SWITCH_SOURCES;
    products: ImportType[];
    onClick?: () => void;
    provider: AllowedImporter;
    isDropdownButton?: boolean;
}

const EasySwitchOauthImportButton = ({ className, provider, products, source, onClick, isDropdownButton }: Props) => {
    const { handleSubmit } = useProductSelectionSubmit();

    const handleClick = () => {
        handleSubmit(provider, products, source);
        onClick?.();
    };

    if (provider === ImportProvider.GOOGLE) {
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
