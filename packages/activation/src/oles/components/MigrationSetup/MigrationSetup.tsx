import React, { type FC, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { Button } from '@proton/atoms/Button/Button';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import type { MigrationConfiguration, MigrationSetupModel } from '../../types';
import { useProviderTokens } from '../../useProviderTokens';
import { useConnectionState } from '../../useConnectionState';
import StepAuthenticate from './StepAuthenticate';
import StepConfigureMigration from './StepConfigureMigration';
import StepInstallApp from './StepInstallApp';

export type MigrationSetupProps = {
    model: MigrationSetupModel;
    onSubmit: (payload: MigrationConfiguration) => void;
};

type MigrationSetupState = {
    currentStep: number;
    completedSteps: number[];
    loading: boolean;
};

const MigrationSetup: FC<MigrationSetupProps> = ({ model, onSubmit }) => {
    const [tokens] = useProviderTokens(OAUTH_PROVIDER.GSUITE);
    const [connectionState, , , resetConnectionState] = useConnectionState();

    const [state, setState] = useState<MigrationSetupState>({
        currentStep: 0,
        completedSteps: [],
        loading: false,
    });

    useEffect(() => {
        resetConnectionState();
    }, [tokens]);

    const steps: {
        id: string;
        text: string;
        isCompleted: () => boolean;
        isDisabled: boolean;
        component: React.JSX.Element;
    }[] = useMemo(
        () =>
            [
                {
                    id: 'authenticate',
                    text: c('BOSS').t`Authenticate`,
                    component: <StepAuthenticate token={tokens?.[0]} />,
                    isCompleted: () => Boolean(tokens?.length),
                    isDisabled: false,
                },
                {
                    id: 'install-app',
                    text: c('BOSS').t`Install migration app`,
                    component: <StepInstallApp />,
                    isCompleted: () => connectionState === 'connected',
                    isDisabled: !tokens?.length,
                },
                {
                    id: 'configure-migration',
                    text: c('BOSS').t`Configure migration`,
                    component: <StepConfigureMigration model={model} />,
                    isCompleted: () => Boolean(model.selectedProducts.length),
                    isDisabled: !tokens?.length || connectionState !== 'connected',
                },
            ].filter(isTruthy),
        [model, tokens, connectionState]
    );

    const { component, isCompleted } = steps[state.currentStep];

    const isLastStep = state.currentStep === steps.length - 1;

    const isStepTicked = (ix: number): boolean => {
        const step = steps[ix];

        if (!step) {
            return false;
        }

        // Last step is never ticked as completed because
        // it may be prefilled validly
        if (ix >= steps.length - 1) {
            return false;
        }

        // Disabled step is missing prerequisites, so cannot
        // be validly completed
        if (step.isDisabled) {
            return false;
        }

        // Ensure the step validation logic passes
        if (!step.isCompleted()) {
            return false;
        }

        return state.completedSteps.includes(ix);
    };

    const changeStep = (nextIx: number) => {
        if (!steps[nextIx]) {
            return;
        }

        setState((state) => ({
            ...state,
            completedSteps: isCompleted() ? [...state.completedSteps, state.currentStep] : state.completedSteps,
            currentStep: nextIx,
        }));
    };

    const onNext = !isCompleted()
        ? undefined
        : () => {
              if (isLastStep) {
                  setState((state) => ({ ...state, loading: true }));
                  return onSubmit(model);
              }

              changeStep(state.currentStep + 1);
          };

    return (
        <>
            <div className="flex flex-1 flex-nowrap relative">
                <ol className="unstyled px-16 shrink-0">
                    {steps.map((step, ix) => (
                        <li key={step.id}>
                            <Button
                                className={clsx(
                                    state.currentStep === ix ? 'bg-weak opacity-1' : 'opacity-50 border-transparent',
                                    'flex items-center text-semibold p-2 m-2 w-full'
                                )}
                                disabled={step.isDisabled}
                                onClick={() => changeStep(ix)}
                            >
                                <span
                                    className="bg-norm flex-noshrink border rounded-full mr-2 ratio-square w-custom text-xs flex items-center justify-center"
                                    style={{ '--w-custom': '1rem' }}
                                >
                                    {isStepTicked(ix) ? <IcCheckmark /> : ix + 1}
                                </span>
                                <span>{step.text}</span>
                            </Button>
                        </li>
                    ))}
                </ol>

                <div className="w-full px-16 overflow-auto">{component}</div>
            </div>

            <div className="w-full flex gap-2 justify-end border-top p-4">
                <Button disabled={!onNext || state.loading} onClick={onNext} color={isLastStep ? 'norm' : undefined}>
                    {isLastStep ? c('Action').t`Save` : c('Action').t`Next`}
                </Button>
            </div>
        </>
    );
};

export default MigrationSetup;
