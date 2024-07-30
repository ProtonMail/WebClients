import { selectSecurityCheckup } from '@proton/account/securityCheckup/slice';
import { useSelector } from '@proton/redux-shared-store';

const useSecurityCheckup = () => {
    return useSelector(selectSecurityCheckup);
};

export default useSecurityCheckup;
