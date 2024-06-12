import { ComponentPropsWithRef } from 'react';

import { c } from 'ttag';

import { Button, Step, Stepper } from '@proton/atoms';
import { AppLink, Icon, Tooltip } from '@proton/components/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import protonWalletLogo from '@proton/styles/assets/img/illustrations/proton-wallet-logo.svg';
import clsx from '@proton/utils/clsx';

import { APP_NAME } from '../../config';

export enum StepKey {
    RecipientsSelection,
    AmountInput,
    ReviewTransaction,
    Send,
}

const steps = [StepKey.RecipientsSelection, StepKey.AmountInput, StepKey.ReviewTransaction, StepKey.Send];

interface ModalHeaderProps extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'title'> {
    onClose: () => void;
    currentStep: StepKey;
    onClickStep: (step: StepKey) => void;
}

export const ModalHeader = ({ onClose, currentStep, onClickStep }: ModalHeaderProps) => {
    const stepByKey: Record<StepKey, string> = {
        [StepKey.RecipientsSelection]: c('Wallet send').t`Recipients`,
        [StepKey.AmountInput]: c('Wallet send').t`Amount`,
        [StepKey.ReviewTransaction]: c('Wallet send').t`Review`,
        [StepKey.Send]: c('Wallet send').t`Send`,
    };

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

                <Stepper position="center" activeStep={steps.findIndex((s) => s === currentStep)}>
                    {steps.map((step) => (
                        <Step
                            key={step}
                            onClick={() => {
                                if (currentStep > step) {
                                    onClickStep(step);
                                }
                            }}
                            className="cursor-pointer"
                        >
                            {stepByKey[step]}
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
