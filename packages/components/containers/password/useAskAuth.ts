import { useEffect, useState } from 'react';
import { InfoAuthedResponse, TwoFaResponse } from '@proton/shared/lib/authentication/interface';
import { getInfo } from '@proton/shared/lib/api/auth';
import { getHasTOTPEnabled, getHasTOTPSettingEnabled } from '@proton/shared/lib/settings/twoFactor';
import { noop } from '@proton/shared/lib/helpers/function';
import { useApi, useUser, useUserSettings } from '../../hooks';

const useAskAuth = (onError: () => void = noop) => {
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [{ isSubUser }] = useUser();
    const api = useApi();
    const [adminAuthTwoFA, setAdminAuthTwoFA] = useState<TwoFaResponse>();

    useEffect(() => {
        if (!isSubUser) {
            return;
        }
        const run = async () => {
            /**
             * There is a special case for admins logged into non-private users. User settings returns two factor
             * information for the non-private user, and not for the admin to which the session actually belongs.
             * So we query auth info to get the information about the admin.
             */
            const infoResult = await api<InfoAuthedResponse>({ ...getInfo(), silent: true });
            setAdminAuthTwoFA(infoResult['2FA']);
        };
        run().catch(onError);
    }, []);

    const hasTOTPEnabled = isSubUser
        ? getHasTOTPEnabled(adminAuthTwoFA?.Enabled)
        : getHasTOTPSettingEnabled(userSettings);

    const isLoading = loadingUserSettings || (isSubUser && !adminAuthTwoFA);

    return [hasTOTPEnabled, isLoading];
};

export default useAskAuth;
