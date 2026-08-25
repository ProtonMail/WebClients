import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';

import { useOptionalSubscriptionModal } from '../../../containers/payments/subscription/SubscriptionModalProvider';
import { type GetUpsellConfigProps, getUpsellConfig } from './getUpsellConfig';

/**
 * Return config props injected in `SubscriptionModal`
 */
const useUpsellConfig = ({
    upsellRef,
    step,
    coupon,
    cycle,
    maximumCycle,
    minimumCycle,
    plan,
    onSubscribed,
    preventInApp = false,
}: GetUpsellConfigProps): { upgradePath: string; onUpgrade?: () => Promise<void> } => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [openSubscriptionModal] = useOptionalSubscriptionModal();
    const { APP_NAME: appName } = useConfig();

    return getUpsellConfig({
        appName,
        openSubscriptionModal,
        subscription,
        user,
        upsellRef,
        step,
        coupon,
        cycle,
        planIDs: plan ? { [plan]: 1 } : undefined,
        onSubscribed,
        preventInApp,
        maximumCycle,
        minimumCycle,
    });
};

export default useUpsellConfig;
