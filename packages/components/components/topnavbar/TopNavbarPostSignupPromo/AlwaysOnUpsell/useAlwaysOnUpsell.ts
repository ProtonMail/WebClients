import { usePreviousSubscription } from '@proton/account/previousSubscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';
import { hasPassLifetime } from '@proton/shared/lib/user/helpers';
import useFlag from '@proton/unleash/useFlag';

import { type OfferHookReturnValue } from '../common/interface';

type EligibilityProps = {
    protonConfig: ProtonConfig;
    user: UserModel;
    previousSubscriptionEndTime: number;
};

export const hasValidApp = (appName: APP_NAMES): appName is 'proton-mail' | 'proton-drive' => {
    return appName === APPS.PROTONMAIL || appName === APPS.PROTONDRIVE;
};

export const getIsUserEligible = ({ protonConfig, user, previousSubscriptionEndTime }: EligibilityProps): boolean => {
    return (
        hasValidApp(protonConfig.APP_NAME) &&
        user.isFree &&
        !user.isDelinquent &&
        !previousSubscriptionEndTime &&
        !hasPassLifetime(user)
    );
};

export const useAlwaysOnUpsell = (): OfferHookReturnValue => {
    const protonConfig = useConfig();
    const [user, userLoading] = useUser();
    const [{ previousSubscriptionEndTime }, loadingPreviousSubscription] = usePreviousSubscription();
    const alwaysOnUpsellFlag = useFlag('AlwaysOnUpsell');

    const isEligible =
        alwaysOnUpsellFlag &&
        getIsUserEligible({
            protonConfig,
            user,
            previousSubscriptionEndTime,
        });

    const isLoading = userLoading || loadingPreviousSubscription;

    return {
        isEligible,
        isLoading,
        openSpotlight: false,
    };
};
