import { isFreeSubscription } from '@proton/shared/lib/constants';

import { useTypedSubscription } from './useSubscription';

const useMozillaCheck = (): [isManagedByMozilla: boolean, loading: boolean] => {
    const [subscription, loading] = useTypedSubscription();

    let isManagedByMozilla = false;
    if (!loading && !isFreeSubscription(subscription)) {
        isManagedByMozilla = subscription.isManagedByMozilla;
    }

    return [isManagedByMozilla, loading];
};

export default useMozillaCheck;
