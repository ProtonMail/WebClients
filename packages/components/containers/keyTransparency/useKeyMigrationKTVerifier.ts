import { KeyMigrationKTVerifier } from '@proton/shared/lib/interfaces';

import useApi from '../../hooks/useApi';
import useConfig from '../../hooks/useConfig';
import useFeature from '../../hooks/useFeature';
import { FeatureCode } from '../features/FeaturesContext';
import createKeyMigrationKTVerifier from './createKeyMigrationKTVerifier';
import { KT_FF } from './ktStatus';

const useKeyMigrationKTVerifier = () => {
    const { get } = useFeature<KT_FF | undefined>(FeatureCode.KeyTransparencyWEB);
    const { APP_NAME: appName } = useConfig();
    const api = useApi();
    const keyMigrationKTVerifier: KeyMigrationKTVerifier = createKeyMigrationKTVerifier(
        async () => {
            return get().then((result) => result?.Value);
        },
        api,
        appName
    );
    return {
        keyMigrationKTVerifier,
    };
};

export default useKeyMigrationKTVerifier;
