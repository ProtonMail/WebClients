import { c } from 'ttag';

import {
    EASY_SWITCH_SOURCE,
    EasySwitchFeatureFlag,
    ImportProvider,
    ImportType,
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
    source: EASY_SWITCH_SOURCE;
    defaultCheckedTypes: ImportType[];
    displayOn: keyof EasySwitchFeatureFlag;
    onClick?: () => void;
    provider: AllowedImporter;
}

const OAuthImportButton = ({ className, provider, defaultCheckedTypes, displayOn, onClick }: Props) => {
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
