import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import useConfig from '@proton/components/hooks/useConfig';
import { useGetFlag } from '@proton/unleash';

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
}: GetUpsellConfigProps): { upgradePath: string; onUpgrade?: () => void } => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const { APP_NAME: appName } = useConfig();
    const getFlag = useGetFlag();

    return getUpsellConfig({
        appName,
        getFlag,
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
