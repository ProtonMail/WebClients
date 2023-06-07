import { KeyMigrationKTVerifier } from '@proton/shared/lib/interfaces';

import useApi from '../../hooks/useApi';
import createKeyMigrationKTVerifier from './createKeyMigrationKTVerifier';
import useKTActivation from './useKTActivation';

const useKeyMigrationKTVerifier = () => {
    const ktActivation = useKTActivation();
    const api = useApi();
    const keyMigrationKTVerifier: KeyMigrationKTVerifier = createKeyMigrationKTVerifier(ktActivation, api);
    return {
        keyMigrationKTVerifier,
    };
};

export default useKeyMigrationKTVerifier;
