import type { JSX } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcCircle } from '@proton/icons/icons/IcCircle';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcPassVault } from '@proton/icons/icons/IcPassVault';
import { IcShield } from '@proton/icons/icons/IcShield';
import { IcUserCircle } from '@proton/icons/icons/IcUserCircle';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { APPS, PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';
import unique from '@proton/utils/unique';

import AppLink from '../../../components/link/AppLink';
import SettingsLink from '../../../components/link/SettingsLink';
import { PASS_ORG_SETUP_STEP_ID, getPassOrgSetupProgress } from './interface';
import type { PassOrgSetupStep, PassOrgSetupStepId } from './interface';

import './PassOrgSetupChecklistSection.scss';

const getAllSteps = (): PassOrgSetupStep[] => [
    { id: PASS_ORG_SETUP_STEP_ID.CREATE_ACCOUNT, label: c('Info').t`Create account` },
    { id: PASS_ORG_SETUP_STEP_ID.INVITE_TEAM, label: c('Info').t`Invite your team to join` },
    { id: PASS_ORG_SETUP_STEP_ID.REVIEW_POLICIES, label: c('Info').t`Review your policies` },
    { id: PASS_ORG_SETUP_STEP_ID.TURN_ON_SSO, label: c('Info').t`Turn on SSO` },
    { id: PASS_ORG_SETUP_STEP_ID.MANAGE_PASSWORDS, label: c('Info').t`Manage passwords & vaults` },
];

const iconProps = { size: 12 as const, style: { color: 'var(--interaction-norm)' } };

type StepCta = { type: 'settings'; path: string } | { type: 'app'; to: string };

const getStepPanels = (): Record<
    PassOrgSetupStepId,
    {
        icon: JSX.Element;
        heading: string;
        description: string;
        primaryLabel: string;
        secondaryLabel?: string;
        cta: StepCta;
    }
> => ({
    [PASS_ORG_SETUP_STEP_ID.CREATE_ACCOUNT]: {
        icon: <IcUserCircle {...iconProps} />,
        heading: c('Title').t`Create account`,
        description: c('Info')
            .t`You've created your ${PASS_APP_NAME} for Business account. This is where it all begins - vaults, teammates, and every login in one place.`,
        primaryLabel: c('Action').t`Manage account`,
        cta: { type: 'settings', path: '/account-password' },
    },
    [PASS_ORG_SETUP_STEP_ID.INVITE_TEAM]: {
        icon: <IcUsers {...iconProps} />,
        heading: c('Title').t`Invite your team`,
        description: c('Info')
            .t`Stop sharing passwords over email or chat. Invite colleagues to an encrypted team vault and manage access from one place.`,
        primaryLabel: c('Action').t`Invite teammates`,
        secondaryLabel: c('Action').t`Skip for now`,
        cta: { type: 'settings', path: '/users-addresses' },
    },
    [PASS_ORG_SETUP_STEP_ID.REVIEW_POLICIES]: {
        icon: <IcShield {...iconProps} />,
        heading: c('Title').t`Review your organization's policies`,
        description: c('Info')
            .t`Set password requirements, 2FA enforcement, and sharing rules to keep your team's vaults secure.`,
        primaryLabel: c('Action').t`Review policies`,
        secondaryLabel: c('Action').t`Skip for now`,
        cta: { type: 'settings', path: '/policies' },
    },
    [PASS_ORG_SETUP_STEP_ID.TURN_ON_SSO]: {
        icon: <IcKey {...iconProps} />,
        heading: c('Title').t`Turn on single sign-on`,
        description: c('Info')
            .t`Let your team sign in with your existing identity provider instead of a separate ${PASS_APP_NAME} password.`,
        primaryLabel: c('Action').t`Set up SSO`,
        secondaryLabel: c('Action').t`Skip for now`,
        cta: { type: 'settings', path: '/single-sign-on' },
    },
    [PASS_ORG_SETUP_STEP_ID.MANAGE_PASSWORDS]: {
        icon: <IcPassVault {...iconProps} />,
        heading: c('Title').t`Manage passwords & vaults`,
        description: c('Info').t`Organize logins into shared vaults and control who on your team can access each one.`,
        primaryLabel: c('Action').t`Manage vaults`,
        secondaryLabel: c('Action').t`Skip for now`,
        cta: { type: 'app', to: '/' },
    },
});

interface ChecklistRowProps {
    label: string;
    done: boolean;
    selected: boolean;
    onClick: () => void;
}

const ChecklistRow = ({ label, done, selected, onClick }: ChecklistRowProps) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className="relative flex flex-nowrap items-center gap-4 rounded px-3 py-4 w-full text-left border-none interactive-pseudo"
        style={{ backgroundColor: selected ? 'var(--interaction-norm-minor-2)' : 'transparent' }}
    >
        <span className="shrink-0 flex">
            {done ? (
                <IcCheckmarkCircleFilled className="color-success" size={5} />
            ) : (
                <IcCircle
                    className={clsx('shrink-0', selected ? 'pass-org-setup-checklist-row-icon--current' : 'color-hint')}
                    size={5}
                />
            )}
        </span>
        <span className={clsx('flex-1 text-rg', done && 'color-weak text-strike', selected && 'text-semibold')}>
            {label}
        </span>
        <IcChevronRight className="shrink-0 color-hint" size={4} />
    </button>
);

interface Props {
    stepIds: PassOrgSetupStepId[];
}

const PassOrgSetupChecklistSection = ({ stepIds }: Props) => {
    const steps = getAllSteps().filter((step) => stepIds.includes(step.id));
    const panels = getStepPanels();

    const { feature, update, loading } = useFeature<PassOrgSetupStepId[]>(FeatureCode.PassB2BOrgSetupChecklist);

    const [locallyCompletedStepIds, setLocallyCompletedStepIds] = useState<PassOrgSetupStepId[]>([]);
    const [selectedStepId, setSelectedStepId] = useState<PassOrgSetupStepId>();

    const savedStepIds = unique([...(feature?.Value ?? []), ...locallyCompletedStepIds]);
    const { completedStepIds, completed, total, percent, firstIncompleteStepId } = getPassOrgSetupProgress(
        stepIds,
        savedStepIds
    );

    const markStepCompleted = (stepId: PassOrgSetupStepId) => {
        if (completedStepIds.includes(stepId)) {
            return;
        }
        setLocallyCompletedStepIds((ids) => [...ids, stepId]);
        update([...savedStepIds, stepId]).catch(noop);
    };

    const currentStepId =
        selectedStepId ?? firstIncompleteStepId ?? steps[0]?.id ?? PASS_ORG_SETUP_STEP_ID.CREATE_ACCOUNT;
    const selectedPanel = panels[currentStepId];
    const isSelectedStepDone = completedStepIds.includes(currentStepId);

    // Rendering only once the saved progress is loaded keeps an early click from overwriting it
    if (loading || completed === total) {
        return null;
    }

    return (
        <div
            className="bg-norm border border-weak rounded-lg overflow-hidden"
            data-testid="pass-org-setup-checklist-section"
        >
            <div className="flex flex-column md:flex-row md:items-center gap-4 p-6">
                <div className="shrink-0">
                    <h2 className="text-2xl text-bold m-0">{c('Title').t`Finish setting up ${PASS_APP_NAME}`}</h2>
                    <p className="color-weak text-rg m-0 mt-1">
                        {c('Info').t`A few quick steps to get your organization protected.`}
                    </p>
                </div>
                <div className="flex-1 flex items-center gap-4">
                    <div className="flex-1 bg-weak rounded-sm h-custom" style={{ '--h-custom': '0.5rem' }}>
                        <div className="h-full rounded-sm bg-success" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="text-rg text-bold color-success shrink-0">
                        {c('Progress').t`${completed} of ${total}`}
                    </span>
                </div>
            </div>
            <div className="border-top border-weak flex flex-column lg:flex-row">
                <div className="flex-1 p-6 flex flex-column">
                    {steps.map((step) => {
                        const done = completedStepIds.includes(step.id);
                        return (
                            <ChecklistRow
                                key={step.id}
                                label={step.label}
                                done={done}
                                selected={step.id === currentStepId}
                                onClick={() => setSelectedStepId(step.id)}
                            />
                        );
                    })}
                </div>
                <div
                    className="pass-org-setup-checklist-panel flex-1 pt-4 px-6 pb-custom flex flex-column gap-4"
                    style={{ '--pb-custom': '2.25rem' }}
                >
                    <div
                        className="rounded-lg flex items-center justify-center shrink-0 w-custom h-custom"
                        style={{
                            '--w-custom': '5rem',
                            '--h-custom': '5rem',
                            backgroundColor: 'var(--interaction-norm-minor-2)',
                        }}
                    >
                        {selectedPanel.icon}
                    </div>
                    <div>
                        <h3 className="text-2xl text-bold m-0">{selectedPanel.heading}</h3>
                        <p className="color-weak text-rg mt-1 mb-0">{selectedPanel.description}</p>
                    </div>
                    <div className="flex-1" />
                    <div className="flex flex-wrap items-center gap-4">
                        {selectedPanel.cta.type === 'app' ? (
                            <ButtonLike
                                as={AppLink}
                                to={selectedPanel.cta.to}
                                toApp={APPS.PROTONPASS}
                                target="_blank"
                                color="norm"
                                size="large"
                                onClick={() => markStepCompleted(currentStepId)}
                            >
                                {selectedPanel.primaryLabel}
                            </ButtonLike>
                        ) : (
                            <ButtonLike
                                as={SettingsLink}
                                path={selectedPanel.cta.path}
                                app={APPS.PROTONPASS}
                                color="norm"
                                size="large"
                                onClick={() => markStepCompleted(currentStepId)}
                            >
                                {selectedPanel.primaryLabel}
                            </ButtonLike>
                        )}
                        {selectedPanel.secondaryLabel && !isSelectedStepDone && (
                            <Button
                                shape="ghost"
                                color="norm"
                                size="large"
                                onClick={() => markStepCompleted(currentStepId)}
                            >
                                {selectedPanel.secondaryLabel}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PassOrgSetupChecklistSection;
