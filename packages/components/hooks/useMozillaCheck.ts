import { useSubscription } from '@proton/account/subscription/hooks';
import { isFreeSubscription } from '@proton/payments';

const useMozillaCheck = (): [isManagedByMozilla: boolean, loading: boolean] => {
    const [subscription, loading] = useSubscription();

    let isManagedByMozilla = false;
    if (!loading && !isFreeSubscription(subscription)) {
        isManagedByMozilla = !!subscription?.isManagedByMozilla;
    }

    return [isManagedByMozilla, loading];
};

export default useMozillaCheck;
