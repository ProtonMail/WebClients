import React, { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcChevronDownFilled } from '@proton/icons/icons/IcChevronDownFilled';
import { IcChevronUpFilled } from '@proton/icons/icons/IcChevronUpFilled';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';
import { SECOND } from '@proton/shared/lib/constants';
import { DKIM_STATE, DMARC_STATE, SPF_STATE, VERIFY_STATE } from '@proton/shared/lib/interfaces/Domain';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import type { MigrationConfiguration, MigrationModel, MigrationSetupModel } from '../../types';
import { useProviderUsers } from '../../useProviderUsers';
import { isTerminal } from '../MigrationAssistant/ImportStatus';
import MigrationAssistant from '../MigrationAssistant/MigrationAssistant';
import StepAuthenticate from './StepAuthenticate';
import StepConfigureMigration from './StepConfigureMigration';
import StepDomain from './StepDomain';
import StepDomainDKIM from './StepDomainDKIM';
import StepDomainDMARC from './StepDomainDMARC';
import StepDomainSPF from './StepDomainSPF';
import StepDomainVerify from './StepDomainVerify';
import StepFinal from './StepFinal';
import StepInstallApp from './StepInstallApp';
import StepInviteUsers from './StepInviteUsers';

import './MigrationSetup.scss';

export type MigrationSetupProps = {
    model: MigrationSetupModel;
    onSubmit: (payload: MigrationConfiguration) => Promise<void>;
};

type StepId =
    | 'configure-migration'
    | 'authenticate'
    | 'install-app'
    | 'domain-setup'
    | 'domain-verify'
    | 'spf-records'
    | 'dkim-records'
    | 'dmarc-records'
    | 'configure-users'
    | 'migrate-accounts'
    | 'invite-users'
    | 'final';

const STEPS: { id: StepId; component?: FC<StepComponentProps>; steps?: typeof STEPS }[] = [
    { id: 'configure-migration', component: StepConfigureMigration },
    { id: 'authenticate', component: StepAuthenticate },
    { id: 'install-app', component: StepInstallApp },
    {
        id: 'domain-setup',
        component: StepDomain,
        steps: [
            { id: 'domain-verify', component: StepDomainVerify },
            { id: 'spf-records', component: StepDomainSPF },
            { id: 'dkim-records', component: StepDomainDKIM },
            { id: 'dmarc-records', component: StepDomainDMARC },
        ],
    },
    {
        id: 'configure-users',
        steps: [
            {
                id: 'migrate-accounts',
                component: MigrationAssistant,
            },
            {
                id: 'invite-users',
                component: StepInviteUsers,
            },
        ],
    },
    {
        id: 'final',
        component: StepFinal,
    },
];

export type StepComponentProps = {
    // MigrationSetupModal before the migration is POSTed,
    // then MigrationModel afterwards
    model: MigrationSetupModel | MigrationModel;
    onNext: (() => void) | (() => Promise<void>) | undefined;
};

type StepConfig = {
    text: string;
    isCompleted: () => boolean;
    optional?: boolean;
    isDisabled: boolean;
};

type MigrationSetupState = {
    currentStep: StepId;
    seenSteps: StepId[];
    expanded: StepId[];
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
                isSubstepList ? 'm-0 pt-2 pl-10' : 'overflow-auto',
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
    const [providerUsers, , refreshProviderUsers] = useProviderUsers(model.domainName);
    const [state, setState] = useState<MigrationSetupState>({
        currentStep: model.importerOrganizationId ? 'migrate-accounts' : 'configure-migration',
        expanded: model.importerOrganizationId ? ['configure-users'] : [],
        seenSteps: model.importerOrganizationId
            ? [
                  'configure-migration',
                  'authenticate',
                  'install-app',
                  'domain-setup',
                  'domain-verify',
                  'spf-records',
                  'dkim-records',
                  'dmarc-records',
                  'migrate-accounts',
                  'invite-users',
              ]
            : [],
        loading: false,
    });

    const hasAnySubmitted = providerUsers?.some((u) => u.ImporterOrganizationUser) ?? false;
    const hasAllSubmittedMigrated =
        hasAnySubmitted &&
        (providerUsers?.filter((u) => u.ImporterOrganizationUser).every((u) => isTerminal(u)) ?? false);
    const hasInactiveUsers =
        providerUsers?.some((u) => u.ImporterOrganizationUser?.HasTemporaryPassword === true) ?? false;
    const hasIncompleteUsers =
        providerUsers?.some((u) => Boolean(u.ImporterOrganizationUser) && !isTerminal(u)) ?? false;

    useEffect(() => {
        let timer: NodeJS.Timeout;

        const refreshAfter = (delay: number) => {
            if (!hasIncompleteUsers && !hasInactiveUsers) {
                return;
            }

            timer = setTimeout(() => {
                refreshProviderUsers().catch(noop);
                refreshAfter(delay);
            }, delay);
        };

        refreshAfter(30 * SECOND);
        return () => clearTimeout(timer);
    }, [hasIncompleteUsers, hasInactiveUsers, refreshProviderUsers]);

    const stepConfigs: Record<StepId, StepConfig> = {
        'configure-migration': {
            text: c('BOSS').t`Configure migration`,
            isCompleted: () => Boolean(model.selectedProducts.length),
            isDisabled: false,
        },
        authenticate: {
            text: c('BOSS').t`Authenticate`,
            isCompleted: () => Boolean(model.tokens?.length),
            isDisabled: !model.selectedProducts.length,
        },
        'install-app': {
            text: c('BOSS').t`Install migration app`,
            isCompleted: () => model.connectionState === 'connected',
            isDisabled: !model.selectedProducts.length || !model.tokens?.length,
        },
        'domain-setup': {
            text: c('BOSS').t`Configure domain`,
            isCompleted: () => Boolean(model.domain),
            isDisabled: !model.selectedProducts.length || !model.domainName,
        },
        'domain-verify': {
            text: c('BOSS').t`Verify your domain`,
            isCompleted: () => model.domain?.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD,
            isDisabled: !model.domain,
        },
        'spf-records': {
            text: c('BOSS').t`Set up secure sending (SPF)`,
            isCompleted: () => model.domain?.SpfState === SPF_STATE.SPF_STATE_GOOD,
            optional: true,
            isDisabled: model.domain?.VerifyState !== VERIFY_STATE.VERIFY_STATE_GOOD,
        },
        'dkim-records': {
            text: c('BOSS').t`Set up secure sending (DKIM)`,
            isCompleted: () => model.domain?.DKIM?.State === DKIM_STATE.DKIM_STATE_GOOD,
            optional: true,
            isDisabled: model.domain?.VerifyState !== VERIFY_STATE.VERIFY_STATE_GOOD,
        },
        'dmarc-records': {
            text: c('BOSS').t`Set up secure sending (DMARC)`,
            isCompleted: () => model.domain?.DmarcState === DMARC_STATE.DMARC_STATE_GOOD,
            optional: true,
            isDisabled: model.domain?.VerifyState !== VERIFY_STATE.VERIFY_STATE_GOOD,
        },
        'configure-users': {
            text: c('BOSS').t`Configure users`,
            isCompleted: () => true,
            isDisabled: !model.tokens?.length,
        },
        'migrate-accounts': {
            text: c('BOSS').t`Migrate accounts`,
            isCompleted: () => hasAllSubmittedMigrated,
            isDisabled: !model.tokens?.length,
        },
        'invite-users': {
            text: c('BOSS').t`Onboard your team`,
            isCompleted: () => hasAnySubmitted && !hasInactiveUsers,
            isDisabled: !model.importerOrganizationId || !hasAnySubmitted,
        },
        final: {
            text: c('BOSS').t`Final step`,
            isCompleted: () => false,
            isDisabled: !model.importerOrganizationId || !model.tokens?.length || !hasAnySubmitted,
        },
    };

    const { flatSteps, stepIndex } = (() => {
        const flatSteps = STEPS.flatMap((s) => [s, ...(s.steps ?? [])]).map((s) => ({ ...s, ...stepConfigs[s.id] }));
        const stepIndex = new Map<StepId, number>(flatSteps.map((s, i) => [s.id, i]));
        return { flatSteps, stepIndex };
    })();

    const activeStep = flatSteps[stepIndex.get(state.currentStep)!];
    const isLastStep = state.currentStep === flatSteps.at(-1)!.id;

    const stepStatusIcon = (step: (typeof STEPS)[number]): React.JSX.Element => {
        const defaultIcon = <IcExclamationCircle className="color-weak shrink-0 visibility-hidden" />;

        const stepConfig = stepConfigs[step.id];
        const substeps = STEPS.find((s) => s.id === step.id)?.steps ?? [];

        if (!stepConfig) {
            return defaultIcon;
        }

        // If step wasn't visited, display nothing
        // Exception: step without a component (only children)
        if (step.component && !state.seenSteps.includes(step.id)) {
            return defaultIcon;
        }

        // Final step never has an icon
        if (step.id === 'final') {
            return defaultIcon;
        }

        if (!step.component && !substeps.every(({ id }) => state.seenSteps.includes(id))) {
            return defaultIcon;
        }

        const isIncomplete =
            !stepConfig.isCompleted() ||
            substeps.some((s) => !stepConfigs[s.id].optional && !stepConfigs[s.id].isCompleted());

        if (!isIncomplete) {
            return <IcCheckmarkCircleFilled className="color-success shrink-0" />;
        }

        return <IcExclamationCircle className="color-weak shrink-0" />;
    };

    const isStepExpanded = (id: StepId): boolean => state.expanded.includes(id);

    const toggleStepExpanded = (id: StepId) => {
        setState((prev) => {
            const expanded = prev.expanded.includes(id)
                ? prev.expanded.filter((expandedId) => expandedId !== id)
                : [...prev.expanded, id];
            return { ...prev, expanded };
        });
    };

    const changeStep = (nextId: StepId) => {
        const nextIx = stepIndex.get(nextId);

        if (nextIx === undefined) {
            return;
        }

        let nextStep = flatSteps[nextIx];
        if (!nextStep.component) {
            nextStep = flatSteps[nextIx + 1];
        }

        setState((state) => ({
            ...state,
            seenSteps:
                nextStep.id === STEPS[STEPS.length - 1].id
                    ? state.seenSteps
                    : Array.from(new Set([...state.seenSteps, activeStep.id, nextId, nextStep.id])),
            currentStep: nextStep.id,
            expanded:
                STEPS.find((s) => s.id === nextId)?.steps && !isStepExpanded(nextId)
                    ? [...state.expanded, nextId]
                    : state.expanded,
        }));
    };

    const onNext = async () => {
        if (!isLastStep) {
            changeStep(flatSteps[stepIndex.get(state.currentStep)! + 1].id);
        }
    };

    const stepComponent = (() => {
        if (!activeStep.component) {
            return;
        }

        return (
            <activeStep.component
                model={model}
                onNext={flatSteps[stepIndex.get(state.currentStep)! + 1]?.isDisabled === true ? undefined : onNext}
            />
        );
    })();

    useEffect(() => {
        void (async () => {
            if (activeStep.id === 'migrate-accounts' && !model.importerOrganizationId) {
                setState((state) => ({ ...state, loading: true }));
                await onSubmit(model);
                setState((state) => ({ ...state, loading: false }));
            }
        })();
    }, [model.importerOrganizationId, activeStep.id]);

    return (
        <>
            <div className="lg:flex flex-1 flex-nowrap flex-column lg:flex-row items-start overflow-auto">
                <MigrationNavigationList className="mt-0 ml-8 xl:ml-12 mb-4 pb-4 pt-12 lg:mb-0 lg:sticky top-0 lg:pb-12">
                    {STEPS.map((step, ix) => (
                        <li key={step.id} className="shrink-0">
                            <MigrationNavigationListStepButton
                                isCurrentStep={state.currentStep === step.id}
                                disabled={stepConfigs[step.id].isDisabled}
                                onClick={() => changeStep(step.id)}
                            >
                                <MigrationNavigationListStepNumber isCurrentStep={state.currentStep === step.id}>
                                    {ix + 1}
                                </MigrationNavigationListStepNumber>
                                <span
                                    className={clsx(
                                        'text-semibold flex-1 text-left inline-flex flex-nowrap items-center gap-2',
                                        state.currentStep === step.id ? 'color-primary' : 'color-weak'
                                    )}
                                >
                                    <span>{stepConfigs[step.id].text}</span>
                                    {step.steps && (
                                        <Button
                                            icon
                                            size="tiny"
                                            shape="ghost"
                                            className="p-0 shrink-0 mr-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleStepExpanded(step.id);
                                            }}
                                        >
                                            {isStepExpanded(step.id) ? (
                                                <IcChevronUpFilled title={c('BOSS').t`Collapse step`} />
                                            ) : (
                                                <IcChevronDownFilled title={c('BOSS').t`Expand step`} />
                                            )}
                                        </Button>
                                    )}
                                </span>

                                {stepStatusIcon(step)}
                            </MigrationNavigationListStepButton>

                            {step.steps && step.steps.length > 0 && isStepExpanded(step.id) && (
                                <MigrationNavigationList isSubstepList>
                                    {step.steps.map((substep, six) => (
                                        <li key={substep.id} className="shrink-0">
                                            <MigrationNavigationListStepButton
                                                isCurrentStep={state.currentStep === substep.id}
                                                disabled={
                                                    stepConfigs[step.id].isDisabled ||
                                                    stepConfigs[substep.id].isDisabled
                                                }
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
                                                    {stepConfigs[substep.id].text}
                                                </span>

                                                {stepStatusIcon(substep)}
                                            </MigrationNavigationListStepButton>
                                        </li>
                                    ))}
                                </MigrationNavigationList>
                            )}
                        </li>
                    ))}
                </MigrationNavigationList>

                <div className="w-full px-4 md:px-8 xl:px-12 py-4 lg:py-12">{stepComponent}</div>
            </div>
        </>
    );
};

export default MigrationSetup;
