import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import useLastSubscriptionEnd from '@proton/components/hooks/useLastSubscriptionEnd';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';
import { hasPassLifetime } from '@proton/shared/lib/user/helpers';
import useFlag from '@proton/unleash/useFlag';

import { type OfferHookReturnValue } from '../common/interface';

type EligibilityProps = {
    protonConfig: ProtonConfig;
    user: UserModel;
    lastSubscriptionEnd: number;
};

export const hasValidApp = (appName: APP_NAMES): appName is 'proton-mail' | 'proton-drive' => {
    return appName === APPS.PROTONMAIL || appName === APPS.PROTONDRIVE;
};

export const getIsUserEligible = ({ protonConfig, user, lastSubscriptionEnd }: EligibilityProps): boolean => {
    return (
        hasValidApp(protonConfig.APP_NAME) &&
        user.isFree &&
        !user.isDelinquent &&
        !lastSubscriptionEnd &&
        !hasPassLifetime(user)
    );
};

export const useAlwaysOnUpsell = (): OfferHookReturnValue => {
    const protonConfig = useConfig();
    const [user, userLoading] = useUser();
    const [subscriptionEnd, loadingSubscriptionEnd] = useLastSubscriptionEnd();
    const alwaysOnUpsellFlag = useFlag('AlwaysOnUpsell');

    const isEligible =
        alwaysOnUpsellFlag &&
        getIsUserEligible({
            protonConfig,
            user,
            lastSubscriptionEnd: subscriptionEnd,
        });

    const isLoading = userLoading || loadingSubscriptionEnd;

    return {
        isEligible,
        isLoading,
        openSpotlight: false,
    };
};
