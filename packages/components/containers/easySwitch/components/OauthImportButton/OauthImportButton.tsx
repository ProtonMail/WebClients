import { FeatureCode } from '@proton/components/containers/features';
import { useFeature, useUser } from '@proton/components/hooks';
import { EASY_SWITCH_SOURCE, EasySwitchFeatureFlag, ImportType } from '@proton/shared/lib/interfaces/EasySwitch';

import { startOauthDraft } from '../../logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '../../logic/store';
import { ImportProvider } from '../../logic/types/shared.types';
import GoogleButton from '../GoogleButton/GoogleButton';

interface Props {
    className?: string;
    source: EASY_SWITCH_SOURCE;
    defaultCheckedTypes: ImportType[];
    displayOn: keyof EasySwitchFeatureFlag;
    onClick?: () => void;
}

const OauthImportButton = ({ className, defaultCheckedTypes, displayOn, onClick }: Props) => {
    const [user, userLoading] = useUser();
    const isDelinquent = !user.hasNonDelinquentScope;

    const dispatch = useEasySwitchDispatch();

    const easySwitchFeature = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const easySwitchFeatureLoading = easySwitchFeature.loading;
    const easySwitchFeatureValue = easySwitchFeature.feature?.Value;

    const disabled = easySwitchFeatureLoading || userLoading || isDelinquent || !easySwitchFeatureValue?.[displayOn];

    return (
        <GoogleButton
            disabled={disabled}
            className={className}
            onClick={() => {
                dispatch(
                    startOauthDraft({
                        // Defaults to google but can be updated later
                        provider: ImportProvider.GOOGLE,
                        products: defaultCheckedTypes,
                    })
                );
                onClick?.();
            }}
        />
    );
};

export default OauthImportButton;
