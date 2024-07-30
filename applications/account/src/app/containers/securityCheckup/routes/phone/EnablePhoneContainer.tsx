import { useState } from 'react';
import { Link, Redirect } from 'react-router-dom';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { getFormattedValue } from '@proton/components/components/v2/phone/helper';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { AuthModal, useEventManager, useModalState, useSecurityCheckup } from '@proton/components/index';
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
    const { securityState } = useSecurityCheckup();
    const { phone } = securityState;

    const [step, setStep] = useState<STEPS>(STEPS.ENABLE);

    const { call } = useEventManager();

    const [authModalProps, setAuthModalOpen, renderAuthModal] = useModalState();

    if (!phone.value || (phone.isEnabled && !authModalProps.open && step === STEPS.ENABLE)) {
        return <Redirect to={SECURITY_CHECKUP_PATHS.ROOT} />;
    }

    const formattedPhoneNumber = getFormattedValue(phone.value);

    if (step === STEPS.SUCCESS) {
        return (
            <SecurityCheckupMain>
                <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={phoneIcon} color="success" />}>
                    {c('l10n_nightly: Security checkup').t`Your recovery phone has been enabled`}
                </SecurityCheckupMainTitle>

                <div className="border rounded flex flex-column gap-2 items-center justify-center p-6">
                    <img src={methodSuccessSrc} alt="" />
                    <div className="text-bold">{formattedPhoneNumber}</div>
                </div>

                <div className="mt-6">
                    {c('l10n_nightly: Security checkup')
                        .t`${BRAND_NAME} will use this phone number to send a reset code by SMS when you reset your password.`}
                </div>

                <ButtonLike className="mt-8" fullWidth as={Link} to={SECURITY_CHECKUP_PATHS.ROOT} color="norm" replace>
                    {c('l10n_nightly: Security checkup').t`Continue to Safety Review`}
                </ButtonLike>
            </SecurityCheckupMain>
        );
    }

    return (
        <>
            {renderAuthModal && (
                <AuthModal
                    config={updateResetPhone({ Reset: 1 })}
                    onCancel={authModalProps.onClose}
                    onSuccess={async () => {
                        await call();
                        setStep(STEPS.SUCCESS);
                    }}
                    {...authModalProps}
                />
            )}
            <SecurityCheckupMain>
                <SecurityCheckupMainTitle prefix={<SecurityCheckupMainIcon icon={phoneIcon} color="danger" />}>
                    {c('l10n_nightly: Security checkup').t`Enable recovery by phone`}
                </SecurityCheckupMainTitle>

                <div className="mb-2">{c('l10n_nightly: Security checkup').t`You recovery phone number is:`}</div>
                <div className="rounded bg-weak p-3 mb-4">{formattedPhoneNumber}</div>

                <div>
                    {getBoldFormattedText(
                        c('l10n_nightly: Security checkup')
                            .t` **Enable recovery by phone** to regain access to your account if you forget your password.`
                    )}
                </div>

                <Button className="mt-8" fullWidth color="norm" onClick={() => setAuthModalOpen(true)}>
                    {c('l10n_nightly: Security checkup').t`Enable recovery by phone`}
                </Button>
            </SecurityCheckupMain>
        </>
    );
};

export default EnablePhoneContainer;
