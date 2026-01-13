import React, { type FC, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { Button } from '@proton/atoms/Button/Button';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import type { MigrationConfiguration, MigrationSetupModel } from '../../types';
import useProviderTokens from '../../useProviderTokens';
import StepConfigureMigration from './StepConfigureMigration';
import StepInstallApp from './StepInstallApp';

export type MigrationSetupProps = {
    model: MigrationSetupModel;
    onSubmit: (payload: MigrationConfiguration) => void;
};

type MigrationSetupState = {
    currentStep: number;
    completedSteps: number[];
};

const MigrationSetup: FC<MigrationSetupProps> = ({ model, onSubmit }) => {
    const [tokens, tokensLoading] = useProviderTokens(OAUTH_PROVIDER.GSUITE);

    const [state, setState] = useState<MigrationSetupState>({
        currentStep: 0,
        completedSteps: [],
    });

    const steps: {
        id: string;
        text: string;
        isInvalid: () => boolean;
        component: React.FC<{ model: MigrationSetupModel }>;
    }[] = useMemo(
        () =>
            [
                {
                    id: 'install-app',
                    text: c('BOSS').t`Authenticate`,
                    component: StepInstallApp,
                    isInvalid: () => !tokens.length,
                },
                {
                    id: 'configure-migration',
                    text: c('BOSS').t`Configure migration`,
                    component: StepConfigureMigration,
                    isInvalid: () => !model.selectedProducts.length,
                },
            ].filter(isTruthy),
        [model.selectedProducts, tokens]
    );

    const { component: StepComponent, isInvalid: check } = steps[state.currentStep];

    const isLastStep = state.currentStep === steps.length - 1;

    const loading = tokensLoading;

    const getNextStep = () => {
        const nextStep = steps.findIndex((s) => s.isInvalid());
        if (nextStep === -1) {
            return steps.length - 1;
        }
        return nextStep;
    };

    useEffect(() => {
        if (loading) {
            return;
        }

        const completedSteps = steps
            .map((step, ix) => (!step.isInvalid() ? ix : undefined))
            .filter((e) => e !== undefined);
        const nextStep = getNextStep();
        setState((state) => ({ ...state, currentStep: nextStep, completedSteps }));
    }, [loading]);

    const onNext = check()
        ? undefined
        : () => {
              if (isLastStep) {
                  return onSubmit(model);
              }

              const nextStep = getNextStep();
              if (!nextStep) {
                  return;
              }
              setState((state) => ({
                  ...state,
                  completedSteps: [...state.completedSteps, state.currentStep],
                  currentStep: nextStep,
              }));
          };

    if (loading) {
        return <SkeletonLoader />;
    }

    return (
        <>
            <div className="flex flex-1 flex-nowrap relative">
                <ol className="unstyled px-16 shrink-0">
                    {steps.map((step, ix) => (
                        <li
                            className={clsx(
                                state.currentStep === ix ? 'bg-weak opacity-1' : 'opacity-50 border-transparent',
                                'flex items-center text-semibold rounded p-2 m-2 border'
                            )}
                            key={step.id}
                        >
                            <span
                                className="bg-norm flex-noshrink border rounded-full mr-2 ratio-square w-custom text-xs flex items-center justify-center"
                                style={{ '--w-custom': '1rem' }}
                            >
                                {ix < steps.length - 1 && state.completedSteps.includes(ix) ? <IcCheckmark /> : ix + 1}
                            </span>
                            <span>{step.text}</span>
                        </li>
                    ))}
                </ol>

                <div className="w-full px-16 overflow-auto">
                    <StepComponent model={model} />
                </div>
            </div>

            <div className="w-full flex gap-2 justify-end border-top p-4">
                <Button disabled={!onNext} onClick={onNext} color={isLastStep ? 'norm' : undefined}>
                    {isLastStep ? c('Action').t`Save` : c('Action').t`Next`}
                </Button>
            </div>
        </>
    );
};

export default MigrationSetup;
