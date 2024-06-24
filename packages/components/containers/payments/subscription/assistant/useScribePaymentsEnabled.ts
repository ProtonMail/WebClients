import { selectUser } from '@proton/account';
import { baseUseSelector } from '@proton/redux-shared-store/sharedContext';

import { isScribePaymentsEnabled } from './helpers';

const useScribePaymentsEnabled = () => {
    // Using the base selector instead of user to support signup
    const user = baseUseSelector(selectUser)?.value;
    return isScribePaymentsEnabled(user);
};

export default useScribePaymentsEnabled;
