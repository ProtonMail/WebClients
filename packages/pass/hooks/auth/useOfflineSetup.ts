import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import { usePasswordTypeSwitch, usePasswordUnlock } from '../../components/Lock/PasswordUnlockProvider';
import { ReauthAction } from '../../lib/auth/reauth';
import { offlineSetup } from '../../store/actions';
import { useRequest } from '../useRequest';

export const useOfflineSetup = () => {
    const confirmPassword = usePasswordUnlock();
    const passwordTypeSwitch = usePasswordTypeSwitch();
    const setup = useRequest(offlineSetup, { initial: true });

    return [
        async () =>
            confirmPassword({
                reauth: {
                    type: ReauthAction.OFFLINE_SETUP,
                    fork: { promptBypass: 'none', promptType: 'offline' },
                },
                onSubmit: (password) => setup.dispatch({ password }),
                message: passwordTypeSwitch({
                    extra: c('Info').t`Please confirm your extra password in order to enable offline mode`,
                    sso: c('Info').t`Please confirm your backup password in order to enable offline mode`,
                    twoPwd: c('Info').t`Please confirm your second password in order to enable offline mode`,
                    default: c('Info').t`Please confirm your ${BRAND_NAME} password in order to enable offline mode`,
                }),
            }),
        setup.loading,
    ] as const;
};
