import { selectRecoveryScore } from '@proton/account/securityCheckup/recoveryScore/recoveryScore';
import { useSelector } from '@proton/redux-shared-store';

export const useRecoveryScore = () => {
    return useSelector(selectRecoveryScore);
};
