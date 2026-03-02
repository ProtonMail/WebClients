import { c } from 'ttag';

import type { EASY_SWITCH_SOURCES, ImportType } from '@proton/activation/src/interface';
import { ImportProvider } from '@proton/activation/src/interface';
import { startOauthDraft } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';

import GoogleButton from './GoogleButton';
import OutlookButton from './OutlookButton';

type AllowedImporter = ImportProvider.GOOGLE | ImportProvider.OUTLOOK;
interface Props {
    className?: string;
    source: EASY_SWITCH_SOURCES;
    defaultCheckedTypes: ImportType[];
    onClick?: () => void;
    provider: AllowedImporter;
    isDropdownButton?: boolean;
}

const OAuthImportButton = ({ className, provider, defaultCheckedTypes, source, onClick, isDropdownButton }: Props) => {
    const dispatch = useEasySwitchDispatch();

    const handleClick = () => {
        dispatch(
            startOauthDraft({
                source,
                provider,
                products: defaultCheckedTypes,
            })
        );
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

export default OAuthImportButton;
