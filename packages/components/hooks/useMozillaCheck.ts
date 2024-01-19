import { isFreeSubscription } from '@proton/shared/lib/constants';

import { useSubscription } from './useSubscription';

const useMozillaCheck = (): [isManagedByMozilla: boolean, loading: boolean] => {
    const [subscription, loading] = useSubscription();

    let isManagedByMozilla = false;
    if (!loading && !isFreeSubscription(subscription)) {
        isManagedByMozilla = !!subscription?.isManagedByMozilla;
    }

    return [isManagedByMozilla, loading];
};

export default useMozillaCheck;
