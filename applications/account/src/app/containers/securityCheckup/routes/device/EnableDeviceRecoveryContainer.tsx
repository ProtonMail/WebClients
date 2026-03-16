import { useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useGetUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { useApi, useSecurityCheckup } from '@proton/components';
import { useSyncDeviceRecovery } from '@proton/components/hooks/useSyncDeviceRecovery';
import useLoading from '@proton/hooks/useLoading';
import { CacheType } from '@proton/redux-utilities';
import { updateDeviceRecovery } from '@proton/shared/lib/api/settingsRecovery';
import { BRAND_NAME, SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';

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

    const api = useApi();

    const syncDeviceRecoveryHelper = useSyncDeviceRecovery();
    const getUserSettings = useGetUserSettings();

    const [loading, withLoading] = useLoading();

    useEffect(() => {
        if (!deviceRecovery.isAvailable || deviceRecovery.isEnabled) {
            history.replace(SECURITY_CHECKUP_PATHS.ROOT);
            return;
        }
    }, []);

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
        await getUserSettings({ cache: CacheType.None });

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
