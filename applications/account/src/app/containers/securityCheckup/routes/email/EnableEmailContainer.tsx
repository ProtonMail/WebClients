import { useState } from 'react';
import { Link, Redirect } from 'react-router-dom';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { useApi, useEventManager, useSecurityCheckup } from '@proton/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useLoading from '@proton/hooks/useLoading';
import { updateResetEmail } from '@proton/shared/lib/api/settings';
import { BRAND_NAME, SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';

import methodSuccessSrc from '../../assets/method-success.svg';
import SecurityCheckupMain from '../../components/SecurityCheckupMain';
import SecurityCheckupMainIcon from '../../components/SecurityCheckupMainIcon';
import SecurityCheckupMainTitle from '../../components/SecurityCheckupMainTitle';
import { emailIcon } from '../../methodIcons';

enum STEPS {
    ENABLE,
    SUCCESS,
}

const EnableEmailContainer = () => {
    const api = useApi();
    const { securityState } = useSecurityCheckup();
    const { email } = securityState;

    const [step, setStep] = useState<STEPS>(STEPS.ENABLE);

    const { call } = useEventManager();

    const [enabling, withEnabling] = useLoading();

    if (!email.value || (email.isEnabled && !enabling && step === STEPS.ENABLE)) {
        return <Redirect to={SECURITY_CHECKUP_PATHS.ROOT} />;
    }

    if (step === STEPS.SUCCESS) {
        return (
            <SecurityCheckupMain>
                <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={emailIcon} color="success" />}>
                    {c('Safety review').t`Your recovery email has been enabled`}
                </SecurityCheckupMainTitle>

                <div className="border rounded flex flex-column gap-2 items-center justify-center p-6">
                    <img src={methodSuccessSrc} alt="" />
                    <div className="text-bold">{email.value}</div>
                </div>

                <div className="mt-6">
                    {c('Safety review')
                        .t`${BRAND_NAME} will use this address to send a reset code by email when you reset your password.`}
                </div>

                <ButtonLike className="mt-8" fullWidth as={Link} to={SECURITY_CHECKUP_PATHS.ROOT} color="norm" replace>
                    {c('Safety review').t`Continue to Safety Review`}
                </ButtonLike>
            </SecurityCheckupMain>
        );
    }

    const enablePasswordResetViaEmail = async () => {
        await api(updateResetEmail({ Reset: 1, PersistPasswordScope: true }));

        await call();
        setStep(STEPS.SUCCESS);
    };

    return (
        <SecurityCheckupMain>
            <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={emailIcon} color="danger" />}>
                {c('Safety review').t`Enable recovery by email`}
            </SecurityCheckupMainTitle>

            <div className="mb-2">{c('Safety review').t`You recovery email address is:`}</div>
            <div className="rounded bg-weak p-3 mb-4">{email.value}</div>

            <div>
                {getBoldFormattedText(
                    c('Safety review')
                        .t`**Enable recovery by email** to regain access to your account if you forget your password.`
                )}
            </div>

            <Button
                className="mt-8"
                fullWidth
                color="norm"
                onClick={() => withEnabling(enablePasswordResetViaEmail)}
                loading={enabling}
            >
                {c('Safety review').t`Enable recovery by email`}
            </Button>
        </SecurityCheckupMain>
    );
};

export default EnableEmailContainer;
