import type { ReactNode } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { selectIsKeylessSsoOrganizationPlan } from '@proton/account/scimSetup';
import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import StepDot from '@proton/components/components/stepDot/StepDot';
import StepDots from '@proton/components/components/stepDots/StepDots';
import { FeatureCode, useFeature } from '@proton/features';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import scimGroupsHeroImg from '@proton/styles/assets/img/onboarding/scim-groups-onboarding-hero.svg';
import scimGroupsApprovalImg from '@proton/styles/assets/img/onboarding/scim-groups-onboarding-tile-approval.svg';
import scimGroupsInviteImg from '@proton/styles/assets/img/onboarding/scim-groups-onboarding-tile-invite.svg';
import scimGroupsSyncedImg from '@proton/styles/assets/img/onboarding/scim-groups-onboarding-tile-synced.svg';
import clsx from '@proton/utils/clsx';
import range from '@proton/utils/range';

import getBoldFormattedText from '../../helpers/getBoldFormattedText';

// Organizations with the keyless SSO entitlement don't have to approve group changes,
// so the "what to expect" step doesn't apply to them.
const getTotalSteps = (isKeyless: boolean) => (isKeyless ? 1 : 2);

const ExpectationRow = ({ illustration, text }: { illustration: string; text: ReactNode }) => (
    <div className="flex flex-row items-center flex-nowrap gap-4">
        <img
            className="shrink-0 w-custom h-custom"
            style={{ '--w-custom': '5rem', '--h-custom': '5rem' }}
            src={illustration}
            alt=""
        />
        <p className="flex-1 m-0">{text}</p>
    </div>
);

const ScimGroupsOnboardingModal = ({ onClose, ...rest }: ModalProps) => {
    const { update } = useFeature<boolean>(FeatureCode.ScimGroupsOnboardingModal);
    const isKeyless = useSelector(selectIsKeylessSsoOrganizationPlan);

    const [step, setStep] = useState(0);
    const totalSteps = getTotalSteps(isKeyless);
    const isLastStep = step === totalSteps - 1;

    const handleClose = () => {
        void update(true);
        onClose?.();
    };

    const handleNext = () => {
        if (isLastStep) {
            handleClose();
        } else {
            setStep((currentStep) => currentStep + 1);
        }
    };

    return (
        <ModalTwo className="p-4" {...rest} onClose={handleClose}>
            <ModalTwoHeader
                title={
                    step === 0
                        ? c('scim').t`New: Manage groups via your identity provider`
                        : c('scim').t`What to expect now that group sync is enabled`
                }
                className="mx-auto mb-8"
                titleClassName="text-center text-4xl"
                hasClose={false}
            />
            <ModalTwoContent>
                <div className="flex flex-column gap-6">
                    {step === 0 && (
                        <>
                            <div className="text-center">
                                <img
                                    className="w-full h-custom"
                                    style={{ '--h-custom': '200px' }}
                                    src={scimGroupsHeroImg}
                                    alt=""
                                />
                            </div>
                            <p className="m-0">
                                {getBoldFormattedText(
                                    c('scim')
                                        .t`You can now sync groups alongside users. Changes push **automatically** when you update your groups on your identity provider.`
                                )}
                            </p>
                            {isKeyless && (
                                <p className="m-0">
                                    {getBoldFormattedText(
                                        c('scim')
                                            .t`**Groups you already set up** in your identity provider are imported automatically.`
                                    )}
                                </p>
                            )}
                        </>
                    )}
                    {step === 1 && (
                        <div className="flex flex-column justify-center gap-4 mb-4">
                            <ExpectationRow
                                illustration={scimGroupsSyncedImg}
                                text={getBoldFormattedText(
                                    c('scim')
                                        .t`**Groups you already set up** in your identity provider are imported automatically.`
                                )}
                            />
                            <ExpectationRow
                                illustration={scimGroupsApprovalImg}
                                text={getBoldFormattedText(
                                    c('scim')
                                        .t`**You'll be able to review** group changes before they take effect to confirm they're intentional`
                                )}
                            />
                            <ExpectationRow
                                illustration={scimGroupsInviteImg}
                                text={getBoldFormattedText(
                                    c('scim')
                                        .t`This approval prompt will **appear every time you update** groups through your identity provider`
                                )}
                            />
                        </div>
                    )}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className={clsx('flex-column flex-nowrap', totalSteps > 1 ? 'mb-2' : 'mb-6')}>
                <Button size="large" color="norm" fullWidth onClick={handleNext}>
                    {isLastStep ? c('Action').t`Got it` : c('Action').t`Next`}
                </Button>
                {totalSteps > 1 && (
                    <div className="text-center mb-0">
                        <StepDots value={step} ulClassName="mb-0 mt-2">
                            {range(0, totalSteps).map((index) => (
                                <StepDot
                                    active={index === step}
                                    key={index}
                                    index={index}
                                    aria-controls={`scim-groups-onboarding-${index}`}
                                    onClick={() => setStep(index)}
                                />
                            ))}
                        </StepDots>
                    </div>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ScimGroupsOnboardingModal;
