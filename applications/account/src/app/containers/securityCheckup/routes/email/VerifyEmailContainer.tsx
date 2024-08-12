import { useState } from 'react';
import { Link, Redirect } from 'react-router-dom';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { useSecurityCheckup } from '@proton/components';
import { BRAND_NAME, SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';

import methodErrorSrc from '../../assets/method-error.svg';
import methodSuccessSrc from '../../assets/method-success.svg';
import SecurityCheckupMain from '../../components/SecurityCheckupMain';
import SecurityCheckupMainIcon from '../../components/SecurityCheckupMainIcon';
import SecurityCheckupMainTitle from '../../components/SecurityCheckupMainTitle';
import { emailIcon } from '../../methodIcons';
import { CodeInput } from '../../verification/CodeInput';

enum STEPS {
    CODE,
    SUCCESS,
    ERROR,
}

const VerifyEmailContainer = () => {
    const { securityState } = useSecurityCheckup();
    const { email } = securityState;

    const [step, setStep] = useState(STEPS.CODE);

    if (step === STEPS.SUCCESS) {
        return (
            <SecurityCheckupMain>
                <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={emailIcon} color="success" />}>
                    {c('Safety review').t`Your recovery email is set`}
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

    if (step === STEPS.ERROR) {
        return (
            <SecurityCheckupMain className="text-center">
                <div className="flex justify-center">
                    <img src={methodErrorSrc} alt="" />
                </div>

                <SecurityCheckupMainTitle>
                    {c('Safety review').t`There was an error verifying your recovery email`}
                </SecurityCheckupMainTitle>

                <div>
                    {c('Safety review')
                        .t`We encountered an error while verifying your recovery email. Please try again later, or contact support if the issue continues.`}
                </div>

                <ButtonLike className="mt-8" fullWidth as={Link} to={SECURITY_CHECKUP_PATHS.ROOT} color="norm">
                    {c('Safety review').t`Back to Safety Review`}
                </ButtonLike>
            </SecurityCheckupMain>
        );
    }

    if (!email.value) {
        return <Redirect to={SECURITY_CHECKUP_PATHS.SET_EMAIL} />;
    }

    if (email.verified) {
        return <Redirect to={SECURITY_CHECKUP_PATHS.ROOT} />;
    }

    const boldEmail = <b key="bold-email">{email.value}</b>;

    return (
        <SecurityCheckupMain>
            <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={emailIcon} color="warning" />}>
                {c('Safety review').t`Verify your recovery email address`}
            </SecurityCheckupMainTitle>

            <div className="mb-12">
                {c('Safety review')
                    .jt`To make sure the email address is yours, enter the verification code sent to ${boldEmail}.`}
            </div>

            <CodeInput
                value={email.value}
                onSuccess={() => setStep(STEPS.SUCCESS)}
                onError={() => setStep(STEPS.ERROR)}
                method="email"
            />
        </SecurityCheckupMain>
    );
};

export default VerifyEmailContainer;
