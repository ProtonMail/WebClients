import type { ComponentPropsWithRef } from 'react';

import { c } from 'ttag';

import { Button, Step, Stepper } from '@proton/atoms';
import { AppLink, Icon, Tooltip } from '@proton/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import protonWalletLogo from '@proton/styles/assets/img/illustrations/proton-wallet-logo.svg';

import { APP_NAME } from '../../config';

export type Steps<T extends string> = { key: T; label: string }[];

interface ModalHeaderProps<T extends string> extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'title'> {
    onClose: () => void;
    currentStep: T;
    onClickStep: (step: T) => void;
    steps: Steps<T>;
}

export const ModalHeaderWithStepper = <T extends string>({
    onClose,
    currentStep,
    onClickStep,
    steps,
}: ModalHeaderProps<T>) => {
    return (
        <div className="modal-two-header">
            <AppLink
                to="/"
                toApp={APP_NAME}
                target="_self"
                className="relative interactive-pseudo-protrude interactive--no-background flex justify-center modal-logo"
            >
                <img src={protonWalletLogo} alt={WALLET_APP_NAME} className="w-full" />
            </AppLink>

            <Stepper position="center" activeStep={steps.findIndex((s) => s.key === currentStep)}>
                {steps.map((step) => (
                    <Step
                        key={step.key}
                        onClick={() => {
                            const stepIndex = steps.findIndex(({ key }) => key === step.key);
                            const currentStepIndex = steps.findIndex(({ key }) => key === currentStep);
                            if (stepIndex < currentStepIndex) {
                                onClickStep(step.key);
                            }
                        }}
                        className="cursor-pointer"
                    >
                        {step.label}
                    </Step>
                ))}
            </Stepper>

            <div className="modal-two-header-actions">
                <Tooltip title={c('Action').t`Close`}>
                    <Button
                        className="shrink-0 rounded-full bg-norm"
                        icon
                        shape="solid"
                        data-testid="modal:close"
                        onClick={onClose}
                    >
                        <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                    </Button>
                </Tooltip>
            </div>
        </div>
    );
};
