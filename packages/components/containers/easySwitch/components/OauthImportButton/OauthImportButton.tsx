import { FeatureCode } from '@proton/components/containers/features';
import { useFeature, useUser } from '@proton/components/hooks';
import { EASY_SWITCH_SOURCE, EasySwitchFeatureFlag } from '@proton/shared/lib/interfaces/EasySwitch';

import { startDraft } from '../../logic/draft/draft.actions';
import { useEasySwitchDispatch } from '../../logic/store';
import { ImportAuthType, ImportProvider, ImportType } from '../../logic/types/shared.types';
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
                    startDraft({
                        // Defaults to google but can be updated later
                        provider: ImportProvider.GOOGLE,
                        authType: ImportAuthType.OAUTH,
                        importType: defaultCheckedTypes,
                    })
                );
                onClick?.();
            }}
        />
    );
};

export default OauthImportButton;
