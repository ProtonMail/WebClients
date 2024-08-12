import { useState } from 'react';
import { Link, Redirect } from 'react-router-dom';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { getFormattedValue } from '@proton/components/components/v2/phone/helper';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useApi, useEventManager, useSecurityCheckup } from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import { updateResetPhone } from '@proton/shared/lib/api/settings';
import { BRAND_NAME, SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';

import methodSuccessSrc from '../../assets/method-success.svg';
import SecurityCheckupMain from '../../components/SecurityCheckupMain';
import SecurityCheckupMainIcon from '../../components/SecurityCheckupMainIcon';
import SecurityCheckupMainTitle from '../../components/SecurityCheckupMainTitle';
import { phoneIcon } from '../../methodIcons';

enum STEPS {
    ENABLE,
    SUCCESS,
}

const EnablePhoneContainer = () => {
    const api = useApi();
    const { securityState } = useSecurityCheckup();
    const { phone } = securityState;

    const [step, setStep] = useState<STEPS>(STEPS.ENABLE);

    const { call } = useEventManager();

    const [enabling, withEnabling] = useLoading();

    if (!phone.value || (phone.isEnabled && !enabling && step === STEPS.ENABLE)) {
        return <Redirect to={SECURITY_CHECKUP_PATHS.ROOT} />;
    }

    const formattedPhoneNumber = getFormattedValue(phone.value);

    if (step === STEPS.SUCCESS) {
        return (
            <SecurityCheckupMain>
                <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={phoneIcon} color="success" />}>
                    {c('Safety review').t`Your recovery phone has been enabled`}
                </SecurityCheckupMainTitle>

                <div className="border rounded flex flex-column gap-2 items-center justify-center p-6">
                    <img src={methodSuccessSrc} alt="" />
                    <div className="text-bold">{formattedPhoneNumber}</div>
                </div>

                <div className="mt-6">
                    {c('Safety review')
                        .t`${BRAND_NAME} will use this phone number to send a reset code by SMS when you reset your password.`}
                </div>

                <ButtonLike className="mt-8" fullWidth as={Link} to={SECURITY_CHECKUP_PATHS.ROOT} color="norm" replace>
                    {c('Safety review').t`Continue to Safety Review`}
                </ButtonLike>
            </SecurityCheckupMain>
        );
    }

    const enablePasswordResetViaPhone = async () => {
        await api(updateResetPhone({ Reset: 1, PersistPasswordScope: true }));

        await call();
        setStep(STEPS.SUCCESS);
    };

    return (
        <SecurityCheckupMain>
            <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={phoneIcon} color="danger" />}>
                {c('Safety review').t`Enable recovery by phone`}
            </SecurityCheckupMainTitle>

            <div className="mb-2">{c('Safety review').t`You recovery phone number is:`}</div>
            <div className="rounded bg-weak p-3 mb-4">{formattedPhoneNumber}</div>

            <div>
                {getBoldFormattedText(
                    c('Safety review')
                        .t` **Enable recovery by phone** to regain access to your account if you forget your password.`
                )}
            </div>

            <Button
                className="mt-8"
                fullWidth
                color="norm"
                onClick={() => withEnabling(enablePasswordResetViaPhone)}
                loading={enabling}
            >
                {c('Safety review').t`Enable recovery by phone`}
            </Button>
        </SecurityCheckupMain>
    );
};

export default EnablePhoneContainer;
