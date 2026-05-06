import type { FC } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { SettingsLink, SettingsSectionWide } from '@proton/components/index';
import { IcBuildings } from '@proton/icons/icons/IcBuildings';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcClock } from '@proton/icons/icons/IcClock';
import type { IconSize } from '@proton/icons/types';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { CircledLogoWithProton } from '../CircledLogoWithProton';
import useB2BOnboardingSteps, { type Step, type StepName } from './useB2BOnboardingSteps';

const IncompleteSvg: FC<{ size?: IconSize; className?: string }> = ({ size = 4, className }) => (
    <svg viewBox="0 0 18 18" className={`icon-size-${size} ${className}`} focusable="false" aria-hidden="true">
        <circle
            cx="9"
            cy="9"
            r="7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeDasharray="1 3"
        />
    </svg>
);

const StepWithState: FC<{ step: Step }> = ({ step }) => (
    <li className="flex flex-nowrap items-center flex-row gap-2 py-1">
        <span className="shrink-0 flex">
            {step.state === 'completed' && <IcCheckmarkCircleFilled className="color-primary" />}
            {step.state === 'not-completed' && <IncompleteSvg className="color-disabled" />}
            {step.state === 'partial' && <IcClock className="color-primary" />}
        </span>
        <span className="flex-1">
            <span>{step.text}</span>
        </span>
    </li>
);

export const DashboardCard: FC = () => {
    const [steps, stepsLoading] = useB2BOnboardingSteps();

    if (!steps || stepsLoading || steps['finalize-migration'].state === 'completed') {
        return null;
    }

    const learnMoreLink = (
        <Href href="#" key="learn-more-link" className="inline-block">
            {c('Link').t`Learn more`}
        </Href>
    );

    const migrationAssistantSteps: StepName[] = ['authenticate-provider', 'migrate', 'finalize-migration'];

    const manualSetupSteps: StepName[] = ['add-domain', 'verify-domain'];

    return (
        <SettingsSectionWide>
            <h2 className="text-bold">{c('BOSS').t`Finish setting up your business account`}</h2>
            <p>{c('BOSS').t`Choose how you want to bring your team and email setup to ${BRAND_NAME}.`}</p>

            <div className="flex flex-column *:min-size-auto lg:flex-row flex-nowrap gap-4">
                <div className="flex flex-1 flex-row items-start flex-nowrap border border-weak rounded-xl p-6 gap-4">
                    <CircledLogoWithProton iconPosition="outside-bottom-right" />
                    <div className="flex flex-1 flex-column flex-nowrap">
                        <h3 className="text-semibold text-xl">{c('BOSS').t`Migrate from Google Workspace`}</h3>
                        <p className="color-weak my-2">
                            {c('BOSS')
                                .t`Move your users, emails, and settings from Google Workspace automatically. We’ll guide you through connecting your account, verifying your domain, and migrating users securely.`}{' '}
                            {learnMoreLink}
                        </p>

                        <p className="my-4">
                            <ButtonLike
                                shape="solid"
                                color="norm"
                                className="shrink-0 rounded-lg"
                                as={SettingsLink}
                                path="/migration-assistant"
                            >
                                {migrationAssistantSteps.some((name) => steps[name].state === 'completed')
                                    ? c('BOSS').t`Continue migration`
                                    : c('BOSS').t`Start migration`}
                            </ButtonLike>
                        </p>

                        <ol className="unstyled mt-2 mb-0 flex flex-column gap-1">
                            {migrationAssistantSteps.map((name) => (
                                <StepWithState key={name} step={steps[name]} />
                            ))}
                        </ol>
                    </div>
                </div>

                <div className="flex flex-1 flex-row items-start flex-nowrap border border-weak rounded-xl p-6 gap-4">
                    <CircledLogoWithProton
                        icon={<IcBuildings className="shrink-0" />}
                        iconPosition="outside-bottom-right"
                    />
                    <div className="flex flex-1 flex-column flex-nowrap">
                        <h3 className="text-semibold text-xl">{c('BOSS').t`Set up manually`}</h3>
                        <p className="color-weak my-2">
                            {c('BOSS')
                                .t`Add users and configure your domain manually for sending and receiving mail. Ideal for small teams starting from a clean slate.`}{' '}
                            {learnMoreLink}
                        </p>

                        <p className="my-4">
                            <ButtonLike
                                as={SettingsLink}
                                path="/domain-names"
                                shape="solid"
                                color="norm"
                                className="shrink-0 rounded-lg"
                            >
                                {c('BOSS').t`Go to Domain names`}
                            </ButtonLike>
                        </p>

                        <ol className="unstyled mt-2 mb-0 flex flex-column gap-1">
                            {manualSetupSteps.map((name) => (
                                <StepWithState key={name} step={steps[name]} />
                            ))}
                        </ol>
                    </div>
                </div>
            </div>
        </SettingsSectionWide>
    );
};
