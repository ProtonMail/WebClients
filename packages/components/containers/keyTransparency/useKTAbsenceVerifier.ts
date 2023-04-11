import { verifyLatestProofOfAbsence } from '@proton/key-transparency/lib';

import { FeatureCode } from '../../containers/features/FeaturesContext';
import useApi from '../../hooks/useApi';
import useConfig from '../../hooks/useConfig';
import useFeature from '../../hooks/useFeature';
import { KT_FF, isKTActive } from './ktStatus';

const useKTAbsenceVerifier = () => {
    const { get } = useFeature<KT_FF | undefined>(FeatureCode.KeyTransparencyWEB);
    const { APP_NAME } = useConfig();
    const api = useApi();
    const keyTransparencyAbsenceVerifier = async (email: string) => {
        const feature = await get().then((result) => result?.Value);
        if (!(await isKTActive(APP_NAME, feature))) {
            return;
        }
        return verifyLatestProofOfAbsence(api, email);
    };
    return {
        keyTransparencyAbsenceVerifier,
    };
};

export default useKTAbsenceVerifier;
