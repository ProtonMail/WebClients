import { useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useGetUserSettings } from '@proton/account/userSettings/hooks';
import { Button, ButtonLike } from '@proton/atoms';
import {
    useApi,
    useAuthentication,
    useConfig,
    useEventManager,
    useGetAddresses,
    useGetUser,
    useGetUserKeys,
    useSecurityCheckup,
} from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { updateDeviceRecovery } from '@proton/shared/lib/api/settingsRecovery';
import { BRAND_NAME, SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import { syncDeviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecovery';

import SecurityCheckupMain from '../../components/SecurityCheckupMain';
import SecurityCheckupMainIcon from '../../components/SecurityCheckupMainIcon';
import SecurityCheckupMainTitle from '../../components/SecurityCheckupMainTitle';
import { deviceIcon } from '../../methodIcons';

enum STEPS {
    ENABLE,
    SUCCESS,
}

const EnableDeviceRecoveryContainer = () => {
    const { securityState } = useSecurityCheckup();
    const { deviceRecovery } = securityState;

    const history = useHistory();

    const [step, setStep] = useState(STEPS.ENABLE);

    const { APP_NAME } = useConfig();
    const api = useApi();
    const authentication = useAuthentication();
    const { call } = useEventManager();

    const getUser = useGetUser();
    const getUserKeys = useGetUserKeys();
    const getAddresses = useGetAddresses();
    const getUserSettings = useGetUserSettings();

    const [loading, withLoading] = useLoading();

    useEffect(() => {
        if (!deviceRecovery.isAvailable || deviceRecovery.isEnabled) {
            history.replace(SECURITY_CHECKUP_PATHS.ROOT);
            return;
        }
    }, []);

    const syncDeviceRecoveryHelper = async (partialUserSettings: Partial<UserSettings>) => {
        const [user, userKeys, addresses, userSettings] = await Promise.all([
            getUser(),
            getUserKeys(),
            getAddresses(),
            getUserSettings(),
        ]);
        return syncDeviceRecovery({
            api,
            user,
            addresses,
            appName: APP_NAME,
            userSettings: { ...userSettings, ...partialUserSettings },
            userKeys,
            authentication,
        });
    };

    if (step === STEPS.SUCCESS) {
        return (
            <SecurityCheckupMain>
                <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={deviceIcon} color="success" />}>
                    {c('Safety review').t`Device-based recovery enabled`}
                </SecurityCheckupMainTitle>

                <div className="mt-6">
                    {c('Safety review')
                        .t`If you forget your ${BRAND_NAME} password and need to reset it, the next time you sign in on this device using your new password, full access to your ${BRAND_NAME} Account will be restored.`}
                </div>

                <ButtonLike className="mt-8" fullWidth as={Link} to={SECURITY_CHECKUP_PATHS.ROOT} color="norm" replace>
                    {c('Safety review').t`Continue to Safety Review`}
                </ButtonLike>
            </SecurityCheckupMain>
        );
    }

    const enableDeviceRecovery = async () => {
        await api(updateDeviceRecovery({ DeviceRecovery: 1 }));
        await syncDeviceRecoveryHelper({ DeviceRecovery: 1 });
        await call();

        setStep(STEPS.SUCCESS);
    };

    return (
        <SecurityCheckupMain>
            <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={deviceIcon} color="danger" />}>
                {c('Safety review').t`Enable device-based recovery`}
            </SecurityCheckupMainTitle>

            <div className="flex flex-column gap-4">
                <div>
                    {c('Safety review')
                        .t`When you enable device-based recovery, ${BRAND_NAME} will store an encrypted backup keychain as a file in your browser’s web storage.`}
                </div>

                <div>
                    {c('Safety review')
                        .t`If you forget your ${BRAND_NAME} password and need to reset it, the next time you sign in this device using your new password, full access to your ${BRAND_NAME} Account will be restored.`}
                </div>

                <div>{c('Safety review').t`You can disable this at any time.`}</div>
            </div>

            <Button
                className="mt-8"
                onClick={() => withLoading(enableDeviceRecovery)}
                loading={loading}
                fullWidth
                color="norm"
            >
                {c('Action').t`Enable device-based recovery`}
            </Button>
        </SecurityCheckupMain>
    );
};

export default EnableDeviceRecoveryContainer;
