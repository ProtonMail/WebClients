import React, { type FC, type ReactNode, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useCustomDomains } from '@proton/account/domains/hooks';
import { EASY_SWITCH_FEATURES, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { Button } from '@proton/atoms/Button/Button';
import { useNotifications } from '@proton/components/index';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import { DKIM_STATE, DMARC_STATE, SPF_STATE, VERIFY_STATE } from '@proton/shared/lib/interfaces/Domain';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import type { MigrationConfiguration, MigrationSetupModel } from '../../types';
import { useConnectionState } from '../../useConnectionState';
import { useProviderTokens } from '../../useProviderTokens';
import StepAuthenticate from './StepAuthenticate';
import StepConfigureMigration from './StepConfigureMigration';
import StepDomain from './StepDomain';
import StepDomainDKIM from './StepDomainDKIM';
import StepDomainDMARC from './StepDomainDMARC';
import StepDomainSPF from './StepDomainSPF';
import StepDomainVerify from './StepDomainVerify';
import StepInstallApp from './StepInstallApp';

import './MigrationSetup.scss';

export type MigrationSetupProps = {
    model: MigrationSetupModel;
    onSubmit: (payload: MigrationConfiguration) => Promise<void>;
};

const STEPS = [
    { id: 'authenticate' },
    { id: 'install-app' },
    {
        id: 'domain-setup',
        steps: [{ id: 'domain-verify' }, { id: 'spf-records' }, { id: 'dkim-records' }, { id: 'dmark-records' }],
    },
    { id: 'configure-migration' },
] as const;

type StepId =
    | (typeof STEPS)[number]['id']
    | Extract<(typeof STEPS)[number], { steps: readonly any[] }>['steps'][number]['id'];

type StepConfig = {
    id: StepId;
    text: string;
    isCompleted: () => boolean;
    optional?: boolean;
    isDisabled: boolean;
    component: ReactNode;
    steps?: StepConfig[];
};

export type StepComponentProps = {
    submitButton?: ReactNode;
};

type MigrationSetupState = {
    currentStep: StepId;
    completedSteps: StepId[];
    loading: boolean;
};

const MigrationNavigationList = ({
    className,
    isSubstepList,
    children,
}: {
    className?: string;
    isSubstepList?: boolean;
    children: React.ReactNode;
}) => {
    return (
        <ol
            className={clsx(
                'migration-setup-step-list unstyled shrink-0 relative gap-2 flex flex-column flex-nowrap',
                isSubstepList ? 'mt-2 mb-0 ml-10 ' : 'gap-2 flex flex-column flex-nowrap',
                className
            )}
        >
            {children}
        </ol>
    );
};

const MigrationNavigationListStepNumber = ({
    isSubstep,
    isCurrentStep,
    children,
    className,
}: {
    isSubstep?: boolean;
    isCurrentStep?: boolean;
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <span
            className={clsx(
                'migration-setup-step-list-number shrink-0 rounded-full flex items-center justify-center text-tabular-nums',
                isSubstep ? 'migration-setup-step-list-number--substep' : 'ratio-square',
                isCurrentStep ? 'bg-primary text-invert' : 'bg-weak color-norm',
                className
            )}
        >
            {children}
        </span>
    );
};

type MigrationNavigationListStepButtonProps = Omit<React.ComponentPropsWithoutRef<'button'>, 'aria-current'> & {
    isCurrentStep?: boolean;
    children: React.ReactNode;
};

const MigrationNavigationListStepButton = ({
    isCurrentStep,
    children,
    ...rest
}: MigrationNavigationListStepButtonProps) => {
    return (
        <button
            type="button"
            className="migration-setup-step-list-button flex w-full gap-2 p-2 items-center text-semibold rounded-xxl border-none relative"
            aria-current={isCurrentStep ? 'step' : false}
            {...rest}
        >
            {children}
        </button>
    );
};

const MigrationSetup: FC<MigrationSetupProps> = ({ model, onSubmit }) => {
    const [tokens] = useProviderTokens(OAUTH_PROVIDER.GSUITE, [EASY_SWITCH_FEATURES.OLES]);
    const [connectionState, , verifyConnectionState] = useConnectionState();
    const { createNotification } = useNotifications();

    const [customDomains] = useCustomDomains();
    const domain = !model.domainName ? undefined : customDomains?.find((d) => d.DomainName === model.domainName);

    const [state, setState] = useState<MigrationSetupState>({
        currentStep: STEPS[0].id,
        completedSteps: [],
        loading: false,
    });

    useEffect(() => {
        setState((state) => ({
            ...state,
            completedSteps: state.completedSteps.filter((s) => s !== 'install-app'),
        }));

        const domainName = tokens?.length ? getEmailParts(tokens[0].Account)[1] : undefined;

        model.setDomainName(domainName);

        if (domainName) {
            void verifyConnectionState();
        }
    }, [tokens]);

    const steps = useMemo<StepConfig[]>(() => {
        return [
            {
                id: 'authenticate',
                text: c('BOSS').t`Authenticate`,
                component: <StepAuthenticate tokens={tokens} />,
                isCompleted: () => Boolean(tokens?.length),
                isDisabled: false,
            },
            {
                id: 'install-app',
                text: c('BOSS').t`Install migration app`,
                component: <StepInstallApp model={model} />,
                isCompleted: () => connectionState === 'connected',
                isDisabled: !tokens?.length,
            },
            {
                id: 'domain-setup',
                text: c('BOSS').t`Configure domain`,
                component: <StepDomain domain={domain} model={model} />,
                isCompleted: () => Boolean(domain),
                isDisabled: !model.domainName || !tokens?.length || connectionState !== 'connected',
                steps: [
                    {
                        id: 'domain-verify',
                        text: c('BOSS').t`Verify your domain`,
                        component: <StepDomainVerify domain={domain} />,
                        isCompleted: () => domain?.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD,
                        isDisabled: domain === undefined,
                    },
                    {
                        id: 'spf-records',
                        text: c('BOSS').t`Set up secure sending (SPF)`,
                        component: <StepDomainSPF domain={domain} />,
                        isCompleted: () => domain?.SpfState === SPF_STATE.SPF_STATE_GOOD,
                        optional: true,
                        isDisabled: domain?.VerifyState !== VERIFY_STATE.VERIFY_STATE_GOOD,
                    },
                    {
                        id: 'dkim-records',
                        text: c('BOSS').t`Set up secure sending (DKIM)`,
                        component: <StepDomainDKIM domain={domain} />,
                        isCompleted: () => domain?.DKIM?.State === DKIM_STATE.DKIM_STATE_GOOD,
                        optional: true,
                        isDisabled: domain?.VerifyState !== VERIFY_STATE.VERIFY_STATE_GOOD,
                    },
                    {
                        id: 'dmark-records',
                        text: c('BOSS').t`Set up secure sending (DMARC)`,
                        component: <StepDomainDMARC domain={domain} />,
                        isCompleted: () => domain?.DmarcState === DMARC_STATE.DMARC_STATE_GOOD,
                        optional: true,
                        isDisabled: domain?.VerifyState !== VERIFY_STATE.VERIFY_STATE_GOOD,
                    },
                ],
            },
            {
                id: 'configure-migration',
                text: c('BOSS').t`Configure migration`,
                component: <StepConfigureMigration model={model} />,
                isCompleted: () => true,
                isDisabled:
                    !tokens?.length ||
                    connectionState !== 'connected' ||
                    domain?.VerifyState !== VERIFY_STATE.VERIFY_STATE_GOOD,
            },
        ];
    }, [model, tokens, connectionState]);

    const { flatSteps, stepIndex } = useMemo(() => {
        const flatSteps = steps.flatMap((s) => [s, ...(s.steps ?? [])]);
        const stepIndex = new Map<StepId, number>(flatSteps.map((s, i) => [s.id, i]));
        return { flatSteps, stepIndex };
    }, [steps]);

    const activeStep = flatSteps[stepIndex.get(state.currentStep)!];
    const isLastStep = state.currentStep === flatSteps.at(-1)!.id;

    const isStepTicked = (id: StepId): boolean => {
        const step = flatSteps.find((s) => s.id === id);

        if (!step) {
            return false;
        }

        // Last step is never ticked as completed because
        // it may be prefilled validly
        if (id === steps.at(-1)?.id) {
            return false;
        }

        // Disabled step is missing prerequisites, so cannot
        // be validly completed
        if (step.isDisabled) {
            return false;
        }

        // Ensure the step validation logic passes
        if (!step.isCompleted() || step.steps?.some((s) => !s.optional && !s.isCompleted())) {
            return false;
        }

        return (
            state.completedSteps.includes(id) && (step.steps ?? []).every((s) => state.completedSteps.includes(s.id))
        );
    };

    const changeStep = (nextId: StepId) => {
        if (!stepIndex.has(nextId)) {
            return;
        }

        setState((state) => ({
            ...state,
            completedSteps:
                activeStep.isCompleted() || activeStep.optional
                    ? Array.from(new Set([...state.completedSteps, state.currentStep]))
                    : state.completedSteps,
            currentStep: nextId,
        }));
    };

    const onNext = () => {
        if (activeStep.id === 'configure-migration' && !model.selectedProducts.length) {
            return createNotification({
                type: 'info',
                text: c('BOSS').t`Please select at least one product to migrate`,
            });
        }

        if (!isLastStep) {
            return changeStep(flatSteps[stepIndex.get(state.currentStep)! + 1].id);
        }

        setState((state) => ({ ...state, loading: true }));
        return onSubmit(model).catch(() => setState((state) => ({ ...state, loading: false })));
    };

    const submitButton = (
        <Button
            disabled={state.loading || flatSteps[stepIndex.get(state.currentStep)! + 1]?.isDisabled === true}
            onClick={onNext}
            color="norm"
        >
            {c('Action').t`Next`}
        </Button>
    );

    // TODO(@djankovic): drop it
    const activeComponent = !activeStep.component
        ? undefined
        : React.cloneElement<StepComponentProps>(activeStep.component as any, { submitButton });

    return (
        <>
            <div className="lg:flex flex-1 flex-nowrap flex-column lg:flex-row relative items-start py-12 overflow-auto">
                <MigrationNavigationList className="mt-0 ml-8 xl:ml-12 mb-8 lg:mb-0 lg:sticky top-0">
                    {steps.map((step, ix) => (
                        <li key={step.id}>
                            <MigrationNavigationListStepButton
                                isCurrentStep={state.currentStep === step.id}
                                disabled={step.isDisabled}
                                onClick={() => changeStep(step.id)}
                            >
                                <MigrationNavigationListStepNumber isCurrentStep={state.currentStep === step.id}>
                                    {ix + 1}
                                </MigrationNavigationListStepNumber>
                                <span
                                    className={clsx(
                                        'text-semibold flex-1 text-left',
                                        state.currentStep === step.id ? 'color-primary' : 'color-weak'
                                    )}
                                >
                                    {step.text}
                                </span>
                                {isStepTicked(step.id) && (
                                    <IcCheckmarkCircleFilled className="color-success shrink-0" />
                                )}
                            </MigrationNavigationListStepButton>

                            {step.steps && step.steps.length > 0 && (
                                <MigrationNavigationList isSubstepList>
                                    {step.steps.map((substep, six) => (
                                        <li key={substep.id}>
                                            <MigrationNavigationListStepButton
                                                isCurrentStep={state.currentStep === substep.id}
                                                disabled={step.isDisabled || substep.isDisabled}
                                                onClick={() => changeStep(substep.id)}
                                            >
                                                <MigrationNavigationListStepNumber
                                                    isSubstep
                                                    isCurrentStep={state.currentStep === substep.id}
                                                >
                                                    {ix + 1}.{six + 1}
                                                </MigrationNavigationListStepNumber>
                                                <span
                                                    className={clsx(
                                                        'text-semibold flex-1 text-left',
                                                        state.currentStep === substep.id
                                                            ? 'color-primary'
                                                            : 'color-weak'
                                                    )}
                                                >
                                                    {substep.text}
                                                </span>
                                                {isStepTicked(substep.id) && (
                                                    <IcCheckmarkCircleFilled className="color-success shrink-0" />
                                                )}
                                                {!isStepTicked(substep.id) &&
                                                    state.completedSteps.includes(substep.id) && (
                                                        <IcExclamationCircle className="color-weak shrink-0" />
                                                    )}
                                            </MigrationNavigationListStepButton>
                                        </li>
                                    ))}
                                </MigrationNavigationList>
                            )}
                        </li>
                    ))}
                    <li key="migration">
                        <MigrationNavigationListStepButton isCurrentStep={false} disabled={true} onClick={noop}>
                            <MigrationNavigationListStepNumber isCurrentStep={false}>
                                {STEPS.length + 1}
                            </MigrationNavigationListStepNumber>
                            <span className={clsx('text-semibold flex-1 text-left color-weak')}>{c('BOSS')
                                .t`Migrate users`}</span>
                        </MigrationNavigationListStepButton>
                    </li>
                </MigrationNavigationList>

                <div className="w-full px-4 md:px-8 xl:px-16 pb-4">{activeComponent}</div>
            </div>
        </>
    );
};

export default MigrationSetup;
