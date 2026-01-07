import { c } from 'ttag';

import { usePasswordTypeSwitch, usePasswordUnlock } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { ReauthAction } from '@proton/pass/lib/auth/reauth';
import { offlineToggle } from '@proton/pass/store/actions';
import { BRAND_NAME } from '@proton/shared/lib/constants';

export const useOfflineSetup = () => {
    const confirmPassword = usePasswordUnlock();
    const passwordTypeSwitch = usePasswordTypeSwitch();
    const toggle = useRequest(offlineToggle, { initial: true });

    return [
        async () =>
            confirmPassword({
                reauth: {
                    type: ReauthAction.OFFLINE_SETUP,
                    fork: { promptBypass: 'none', promptType: 'offline' },
                },
                onSubmit: (loginPassword) => toggle.dispatch({ loginPassword, enabled: true }),
                message: passwordTypeSwitch({
                    extra: c('Info').t`Please confirm your extra password in order to enable offline mode`,
                    sso: c('Info').t`Please confirm your backup password in order to enable offline mode`,
                    twoPwd: c('Info').t`Please confirm your second password in order to enable offline mode`,
                    default: c('Info').t`Please confirm your ${BRAND_NAME} password in order to enable offline mode`,
                }),
            }),
        toggle.loading,
    ] as const;
};
