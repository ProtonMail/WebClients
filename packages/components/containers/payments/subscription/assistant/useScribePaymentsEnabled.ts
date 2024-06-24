import { useUser } from '@proton/components/hooks';

import { isScribePaymentsEnabled } from './helpers';

const useScribePaymentsEnabled = () => {
    const [user] = useUser();
    return isScribePaymentsEnabled(user);
};

export default useScribePaymentsEnabled;
