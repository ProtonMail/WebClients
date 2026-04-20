import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import StepDot from '@proton/components/components/stepDot/StepDot';
import StepDots from '@proton/components/components/stepDots/StepDots';
import adminRolesImg from '@proton/styles/assets/img/onboarding/admin-roles/admin-roles.svg';
import organizationAdminRoleImg from '@proton/styles/assets/img/onboarding/admin-roles/organization-admin-role.svg';
import securityAdminRoleImg from '@proton/styles/assets/img/onboarding/admin-roles/security-admin-role.svg';
import userAdminRoleImg from '@proton/styles/assets/img/onboarding/admin-roles/user-admin-role.svg';
import range from '@proton/utils/range';

interface Props {
    onClose?: () => void;
    open?: boolean;
}

const TOTAL_STEPS = 2;

const AdminRolesOnboardingModal = (props: Props) => {
    const [step, setStep] = useState(0);
    const isLastStep = step === TOTAL_STEPS - 1;

    const handleNext = () => {
        if (isLastStep) {
            props.onClose?.();
        } else {
            setStep((s) => s + 1);
        }
    };

    return (
        <ModalTwo {...props} size="medium">
            <ModalTwoContent className="mt-12 mx-12 mb-6">
                {step === 0 && (
                    <>
                        <h1 className="text-2xl text-bold text-center mb-8">
                            {c('Admin roles onboarding').t`New: Control admin access for individual users`}
                        </h1>
                        <div className="text-center mb-8">
                            <img
                                className="w-full"
                                src={adminRolesImg}
                                alt={c('Admin roles onboarding').t`Admin roles`}
                            />
                        </div>
                        <p className="color-weak mb-8">
                            {c('Admin roles onboarding')
                                .t`Delegate management by assigning specific admin roles. Give each admin only the access they need. This follows the principle of least privilege, protecting your organization from compromised accounts and accidental errors.`}
                        </p>
                    </>
                )}
                {step === 1 && (
                    <>
                        <div className="text-center mb-12">
                            <h1 className="text-2xl text-bold">{c('Admin roles onboarding').t`3 new admin roles`}</h1>
                            <p className="color-weak mt-2">
                                {c('Admin roles onboarding').t`Delegate management with the appropriate admin role.`}
                            </p>
                        </div>
                        <div className="flex flex-column gap-4 mb-12">
                            <div className="flex flex-row items-center gap-4">
                                <img
                                    className="shrink-0 w-custom h-custom"
                                    style={{ '--w-custom': '5rem', '--h-custom': '5rem' }}
                                    src={organizationAdminRoleImg}
                                    alt={c('Admin roles onboarding').t`Organization admin`}
                                />
                                <p className="flex-1 m-0">
                                    <span className="text-semibold">{c('Admin roles onboarding')
                                        .t`Organization admin:`}</span>{' '}
                                    {c('Admin roles onboarding')
                                        .t`Manage all users, groups, storage, security, billing, audit logs, and system configurations.`}
                                </p>
                            </div>
                            <div className="flex flex-row items-center gap-4">
                                <img
                                    className="shrink-0 w-custom h-custom"
                                    style={{ '--w-custom': '5rem', '--h-custom': '5rem' }}
                                    src={userAdminRoleImg}
                                    alt={c('Admin roles onboarding').t`User admin`}
                                />
                                <p className="flex-1 m-0">
                                    <span className="text-semibold">{c('Admin roles onboarding').t`User admin:`}</span>{' '}
                                    {c('Admin roles onboarding')
                                        .t`Manage users, groups, and storage for all members, assign roles, and allocate licenses.`}
                                </p>
                            </div>
                            <div className="flex flex-row items-center gap-4">
                                <img
                                    className="shrink-0 w-custom h-custom"
                                    style={{ '--w-custom': '5rem', '--h-custom': '5rem' }}
                                    src={securityAdminRoleImg}
                                    alt={c('Admin roles onboarding').t`Security admin`}
                                />
                                <p className="flex-1 m-0">
                                    <span className="text-semibold">{c('Admin roles onboarding')
                                        .t`Security admin:`}</span>{' '}
                                    {c('Admin roles onboarding')
                                        .t`Configure security policies, data retention, and VPN infrastructure, and manage audit logs.`}
                                </p>
                            </div>
                        </div>
                    </>
                )}
                <footer>
                    <Button size="large" color="norm" fullWidth onClick={handleNext}>
                        {isLastStep ? c('Action').t`Got it` : c('Action').t`Next`}
                    </Button>
                </footer>
                <div className="text-center mt-4">
                    <StepDots value={step} ulClassName="mt-0 mb-0">
                        {range(0, TOTAL_STEPS).map((index) => (
                            <StepDot
                                active={index === step}
                                key={index}
                                index={index}
                                aria-controls={`admin-roles-onboarding-${index}`}
                                onClick={() => setStep(index)}
                            />
                        ))}
                    </StepDots>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default AdminRolesOnboardingModal;
