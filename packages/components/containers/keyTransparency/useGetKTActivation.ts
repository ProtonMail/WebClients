import { APP_NAMES } from '@proton/shared/lib/constants';
import { GetKTActivation, KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import useConfig from '../../hooks/useConfig';
import useFeature from '../../hooks/useFeature';
import { FeatureCode } from '../features';
import { KT_FF, KtFeatureEnum, isKTActive } from './ktStatus';

export const createGetKTActivation = (featureFlag: Promise<KT_FF>, appName: APP_NAMES): GetKTActivation => {
    return async (): Promise<KeyTransparencyActivation> => {
        const feature = await featureFlag;
        if (!(await isKTActive(appName, feature))) {
            return KeyTransparencyActivation.DISABLED;
        }
        if (feature == KtFeatureEnum.ENABLE_CORE) {
            return KeyTransparencyActivation.LOG_ONLY;
        }
        if (feature == KtFeatureEnum.ENABLE_UI) {
            return KeyTransparencyActivation.SHOW_UI;
        }
        return KeyTransparencyActivation.DISABLED;
    };
};

const useGetKTActivation = () => {
    const featureFlag = useFeature<KT_FF | undefined>(FeatureCode.KeyTransparencyWEB);
    const { APP_NAME: appName } = useConfig();
    const ffPromise = featureFlag.get().then((result) => result?.Value);
    return createGetKTActivation(ffPromise, appName);
};

export default useGetKTActivation;
