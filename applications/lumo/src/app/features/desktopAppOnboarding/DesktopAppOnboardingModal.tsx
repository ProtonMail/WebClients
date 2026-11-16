import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import { BRAND_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { LUMO_UPGRADE_TRIGGER_CLASS } from '../../constants';
import {
    AllSetIllustration,
    ConnectorsIllustration,
    NotificationsIllustration,
    PlusPlanIllustration,
    SchedulesIllustration,
    SkillsIllustration,
    WelcomeIllustration,
} from './DesktopAppOnboardingIllustrations';
import type { DesktopAppOnboardingFinal, DesktopAppOnboardingStep } from './desktopAppOnboardingSteps';

import './DesktopAppOnboardingModal.scss';

interface StepCopy {
    title: string;
    description: string;
}

const getStepCopy = (step: DesktopAppOnboardingStep, final: DesktopAppOnboardingFinal): StepCopy => {
    switch (step) {
        case 'welcome':
            return {
                title: c('collider_2025: Title').t`Meet the ${LUMO_SHORT_APP_NAME} desktop app`,
                description: c('collider_2025: Description')
                    .t`Ask questions, explore ideas, and get things done. Your conversations stay private, even from us.`,
            };
        case 'connectors':
            return {
                title: c('collider_2025: Title').t`Connect your apps and files`,
                description: c('collider_2025: Description')
                    .t`Give ${LUMO_SHORT_APP_NAME} access to your emails, messages, and files through connections that run locally on your device.`,
            };
        case 'skills':
            return {
                title: c('collider_2025: Title').t`Teach ${LUMO_SHORT_APP_NAME} how you work`,
                // translator: "/" is the key to type in the chat box to pick a skill; keep it as is.
                description: c('collider_2025: Description')
                    .t`Save instructions for tasks you do often, or start from ${BRAND_NAME}'s skills. Type / in any chat to use one.`,
            };
        case 'schedules':
            return {
                title: c('collider_2025: Title').t`Set tasks to repeat`,
                description: c('collider_2025: Description')
                    .t`Schedule morning briefings, weekly recaps, and other recurring tasks. ${LUMO_SHORT_APP_NAME} notifies you when they’re done.`,
            };
        case 'notifications':
            return {
                title: c('collider_2025: Title').t`Turn on notifications`,
                description: c('collider_2025: Description')
                    .t`Get notified when ${LUMO_SHORT_APP_NAME} finishes a task or needs your approval. Change this anytime in Settings.`,
            };
        case 'final':
            if (final === 'upsell') {
                return {
                    title: c('collider_2025: Title').t`Go further with ${LUMO_SHORT_APP_NAME} Plus`,
                    description: c('collider_2025: Description')
                        .t`More room for your ideas, projects, and everyday tasks. Upgrade for higher limits and unlimited projects and skills.`,
                };
            }
            return {
                title: c('collider_2025: Title').t`Connect your first app`,
                description: c('collider_2025: Description')
                    .t`Connect an app or local folder so ${LUMO_SHORT_APP_NAME} can help you find information, catch up on emails, and work with your files.`,
            };
    }
};

const getIllustration = (step: DesktopAppOnboardingStep, final: DesktopAppOnboardingFinal): ReactNode => {
    switch (step) {
        case 'welcome':
            return <WelcomeIllustration />;
        case 'connectors':
            return <ConnectorsIllustration />;
        case 'skills':
            return <SkillsIllustration />;
        case 'schedules':
            return <SchedulesIllustration />;
        case 'notifications':
            return <NotificationsIllustration />;
        case 'final':
            return final === 'upsell' ? <PlusPlanIllustration /> : <AllSetIllustration />;
    }
};

interface StepDotsProps {
    count: number;
    current: number;
}

const StepDots = ({ count, current }: StepDotsProps) => {
    const stepNumber = current + 1;
    return (
        <div className="flex flex-nowrap items-center gap-1.5">
            {Array.from({ length: count }, (_, index) => {
                return (
                    <span
                        key={index}
                        className={clsx('dao-dot rounded-full shrink-0', index === current && 'dao-dot--active')}
                        aria-hidden="true"
                    />
                );
            })}
            <span className="sr-only">
                {
                    // translator: Progress of the desktop app tour, e.g. "Step 2 of 6".
                    c('collider_2025: Info').t`Step ${stepNumber} of ${count}`
                }
            </span>
        </div>
    );
};

/** "Get Lumo Plus" takes the same route as the sidebar upgrade button: the in-app modal, or a settings link. */
interface DesktopAppOnboardingUpgrade {
    path?: string;
}

interface DesktopAppOnboardingModalProps extends ModalProps {
    steps: DesktopAppOnboardingStep[];
    stepIndex: number;
    final: DesktopAppOnboardingFinal;
    upgrade: DesktopAppOnboardingUpgrade;
    isRequestingNotifications: boolean;
    onNext: () => void;
    onBack: () => void;
    onTurnOnNotifications: () => void;
    onNotificationsNotNow: () => void;
    onStartChatting: () => void;
    onGetLumoPlus: () => void;
    onSetUpConnector: () => void;
}

export const DesktopAppOnboardingModal = ({
    steps,
    stepIndex,
    final,
    upgrade,
    isRequestingNotifications,
    onNext,
    onBack,
    onTurnOnNotifications,
    onNotificationsNotNow,
    onStartChatting,
    onGetLumoPlus,
    onSetUpConnector,
    ...modalProps
}: DesktopAppOnboardingModalProps) => {
    const step = steps[stepIndex];
    const { title, description } = getStepCopy(step, final);
    const titleId = 'desktop-app-onboarding-title';

    const backButton = (
        <Button
            shape="outline"
            color="weak"
            className="dao-back"
            onClick={onBack}
            disabled={step === 'notifications' && isRequestingNotifications}
        >
            {c('collider_2025: Action').t`Back`}
        </Button>
    );

    const renderButtons = () => {
        if (step === 'welcome') {
            return (
                <Button color="norm" onClick={onNext}>
                    {c('collider_2025: Action').t`Get started`}
                </Button>
            );
        }
        if (step === 'notifications') {
            return (
                <>
                    <span className="mr-auto">{backButton}</span>
                    {/* Kept together: in long languages they move to their own row instead of wrapping their labels. */}
                    <span className="flex flex-nowrap gap-2 ml-auto">
                        <Button shape="ghost" onClick={onNotificationsNotNow} disabled={isRequestingNotifications}>
                            {c('collider_2025: Action').t`Not now`}
                        </Button>
                        <Button color="norm" onClick={onTurnOnNotifications} loading={isRequestingNotifications}>
                            {c('collider_2025: Action').t`Turn on notifications`}
                        </Button>
                    </span>
                </>
            );
        }
        if (step === 'final' && final === 'upsell') {
            const getLumoPlusLabel = c('collider_2025: Action').t`Get ${LUMO_SHORT_APP_NAME} Plus`;
            return (
                <>
                    <Button shape="outline" color="weak" className="dao-back" onClick={onStartChatting}>
                        {c('collider_2025: Action').t`Start chatting`}
                    </Button>
                    {upgrade.path ? (
                        <ButtonLike
                            as={SettingsLink}
                            path={upgrade.path}
                            color="norm"
                            className={LUMO_UPGRADE_TRIGGER_CLASS}
                            onClick={onGetLumoPlus}
                        >
                            {getLumoPlusLabel}
                        </ButtonLike>
                    ) : (
                        <Button color="norm" className={LUMO_UPGRADE_TRIGGER_CLASS} onClick={onGetLumoPlus}>
                            {getLumoPlusLabel}
                        </Button>
                    )}
                </>
            );
        }
        if (step === 'final') {
            return (
                <Button color="norm" onClick={onSetUpConnector}>
                    {c('collider_2025: Action').t`Set up a connector`}
                </Button>
            );
        }
        return (
            <>
                {backButton}
                <Button color="norm" onClick={onNext}>
                    {c('collider_2025: Action').t`Next`}
                </Button>
            </>
        );
    };

    return (
        <ModalTwo {...modalProps} className="desktop-app-onboarding" aria-labelledby={titleId}>
            {/* flex-auto, not flex-1: on narrow windows the dialog has no set height, and a 0 basis collapses it. */}
            {/* Two columns need the full 840px dialog, so they start at lg; narrower windows get the text column only. */}
            <div className="flex flex-column lg:flex-row flex-nowrap flex-auto overflow-auto">
                <div
                    className="flex flex-column flex-nowrap justify-space-between gap-8 shrink-0 px-6 pt-8 pb-6 sm:px-10 sm:pt-10 sm:pb-8 lg:w-custom"
                    style={{ '--lg-w-custom': '27.5rem' }}
                >
                    <div className="flex flex-column flex-nowrap gap-6">
                        <StepDots count={steps.length} current={stepIndex} />
                        <div className="flex flex-column flex-nowrap gap-3">
                            <h2 id={titleId} className="dao-title text-5xl text-semibold color-norm m-0">
                                {title}
                            </h2>
                            <p className="m-0 text-lg lh-rg color-weak">{description}</p>
                        </div>
                    </div>
                    <div className="dao-footer flex flex-wrap items-center justify-end gap-2">{renderButtons()}</div>
                </div>
                <div className="hidden lg:block flex-1 min-w-0">{getIllustration(step, final)}</div>
            </div>
            <Button
                icon
                shape="ghost"
                className="dao-close absolute"
                onClick={modalProps.onClose}
                title={c('collider_2025: Action').t`Close`}
            >
                <LumoIcon name="X" size={20} strokeWidth={1.4} aria-hidden />
            </Button>
        </ModalTwo>
    );
};
