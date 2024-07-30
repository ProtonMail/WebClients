import { getHasOutdatedRecoveryFile } from '@proton/shared/lib/recoveryFile/recoveryFile';

import useUser from './useUser';

const useHasOutdatedRecoveryFile = () => {
    const [{ Keys }] = useUser();
    return getHasOutdatedRecoveryFile(Keys);
};

export default useHasOutdatedRecoveryFile;
