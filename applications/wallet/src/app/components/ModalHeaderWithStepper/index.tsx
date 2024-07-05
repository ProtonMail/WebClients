import { ComponentPropsWithRef } from 'react';

import { c } from 'ttag';

import { Button, Step, Stepper } from '@proton/atoms';
import { AppLink, Icon, Tooltip } from '@proton/components/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import protonWalletLogo from '@proton/styles/assets/img/illustrations/proton-wallet-logo.svg';
import clsx from '@proton/utils/clsx';

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
        <div className="modal-two-header border-bottom pb-6">
            <div className={clsx('flex flex-nowrap shrink-0 items-start justify-space-between')}>
                <AppLink
                    to="/"
                    toApp={APP_NAME}
                    target="_self"
                    className="relative interactive-pseudo-protrude interactive--no-background"
                >
                    <img src={protonWalletLogo} alt={WALLET_APP_NAME} />
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

                <div className="modal-two-header-actions flex shrink-0 flex-nowrap items-stretch">
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
        </div>
    );
};
