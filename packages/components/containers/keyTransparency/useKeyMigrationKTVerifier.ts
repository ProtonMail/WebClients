import { KeyMigrationKTVerifier } from '@proton/shared/lib/interfaces';

import useApi from '../../hooks/useApi';
import createKeyMigrationKTVerifier from './createKeyMigrationKTVerifier';
import useGetKTActivation from './useGetKTActivation';

const useKeyMigrationKTVerifier = () => {
    const getKTActivation = useGetKTActivation();
    const api = useApi();
    const keyMigrationKTVerifier: KeyMigrationKTVerifier = createKeyMigrationKTVerifier(getKTActivation, api);
    return {
        keyMigrationKTVerifier,
    };
};

export default useKeyMigrationKTVerifier;
