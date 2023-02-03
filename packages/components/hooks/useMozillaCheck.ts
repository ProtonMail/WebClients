import { SubscriptionModel } from '@proton/shared/lib/interfaces';

import { useTypedSubscription } from './useSubscription';

const useMozillaCheck = (): [isManagedByMozilla: boolean, loading: boolean] => {
    const [subscription, loading] = useTypedSubscription();

    let isManagedByMozilla = false;
    if (!loading) {
        isManagedByMozilla = !!(subscription as SubscriptionModel).isManagedByMozilla;
    }

    return [isManagedByMozilla, loading];
};

export default useMozillaCheck;
