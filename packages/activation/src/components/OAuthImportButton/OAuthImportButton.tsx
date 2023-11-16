import { c } from 'ttag';

import {
    EasySwitchFeatureFlag,
    ImportProvider,
    ImportType,
    NEW_EASY_SWITCH_SOURCES,
} from '@proton/activation/src/interface';
import { startOauthDraft } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';
import { FeatureCode } from '@proton/components/containers/features';
import { useFeature, useUser } from '@proton/components/hooks';

import GoogleButton from './GoogleButton';
import OutlookButton from './OutlookButton';

type AllowedImporter = ImportProvider.GOOGLE | ImportProvider.OUTLOOK;
interface Props {
    className?: string;
    source: NEW_EASY_SWITCH_SOURCES;
    defaultCheckedTypes: ImportType[];
    displayOn: keyof EasySwitchFeatureFlag;
    onClick?: () => void;
    provider: AllowedImporter;
}

const OAuthImportButton = ({ className, provider, defaultCheckedTypes, displayOn, source, onClick }: Props) => {
    const [user, userLoading] = useUser();
    const isDelinquent = !user.hasNonDelinquentScope;

    const dispatch = useEasySwitchDispatch();

    const easySwitchFeature = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const easySwitchFeatureLoading = easySwitchFeature.loading;
    const easySwitchFeatureValue = easySwitchFeature.feature?.Value;

    const disabled = easySwitchFeatureLoading || userLoading || isDelinquent || !easySwitchFeatureValue?.[displayOn];

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
                disabled={disabled}
                className={className}
                onClick={handleClick}
                label={c('Action').t`Import from Google`}
            />
        );
    }

    if (provider === ImportProvider.OUTLOOK) {
        return (
            <OutlookButton
                disabled={disabled}
                className={className}
                onClick={handleClick}
                label={c('Action').t`Import from Outlook`}
            />
        );
    }

    return null;
};

export default OAuthImportButton;
