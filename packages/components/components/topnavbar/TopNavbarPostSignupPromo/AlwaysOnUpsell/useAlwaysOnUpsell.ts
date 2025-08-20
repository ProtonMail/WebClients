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
};

export const hasValidApp = (appName: APP_NAMES): appName is 'proton-mail' | 'proton-drive' => {
    return appName === APPS.PROTONMAIL || appName === APPS.PROTONDRIVE;
};

export const getIsUserEligible = ({ protonConfig, user }: EligibilityProps): boolean => {
    return hasValidApp(protonConfig.APP_NAME) && user.isFree && !user.isDelinquent && !hasPassLifetime(user);
};

export const useAlwaysOnUpsell = (): OfferHookReturnValue => {
    const protonConfig = useConfig();
    const [user, userLoading] = useUser();
    const alwaysOnUpsellFlag = useFlag('AlwaysOnUpsell');

    const isEligible =
        alwaysOnUpsellFlag &&
        getIsUserEligible({
            protonConfig,
            user,
        });

    return {
        isEligible,
        isLoading: userLoading,
        openSpotlight: false,
    };
};
