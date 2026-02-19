import { Fragment } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon } from '@proton/components';
import type { IconName } from '@proton/icons/types';

import { Container } from '../Container';
import type { OnboardingProps } from '../interface';

import './PendingInvitationStep.scss';

export const PendingInvitationStep = () => {
    const steps: { icon: IconName; text: string; isDone: boolean }[] = [
        {
            icon: 'envelope',
            text: c('Onboarding Info').t`Invitation received`,
            isDone: true,
        },
        {
            icon: 'envelope-open',
            text: c('Onboarding Info').t`Invitation accepted`,
            isDone: true,
        },
        {
            icon: 'key',
            text: c('Onboarding Info').t`Final approval pending`,
            isDone: false,
        },
    ];

    return (
        <Container
            title={c('Onboarding Info').t`Final approval in progress`}
            subtitle={c('Onboarding Info').t`Hang tight`}
            rightContent={
                <div className="flex flex-column justify-center ratio-square w-full p-8">
                    {steps.map(({ icon, text, isDone }, index) => {
                        const isLastStep = index === steps.length - 1;

                        return (
                            <Fragment key={text}>
                                <div className={'rounded bg-weak p-4 text-xl flex items-center justify-space-between'}>
                                    <div className="flex items-center gap-2">
                                        <Icon name={icon} size={6} />
                                        {text}
                                    </div>
                                    <Icon
                                        size={6}
                                        className={isDone ? 'color-success' : 'color-warning'}
                                        name={isDone ? 'checkmark-circle-filled' : 'clock-circle-filled'}
                                    />
                                </div>
                                {!isLastStep && <div className="steps-line p-4 ml-8" />}
                            </Fragment>
                        );
                    })}
                </div>
            }
        >
            <p>
                {c('Onboarding Info').t`The owner needs to confirm sharing access. You'll get an email once it's done.`}
            </p>
        </Container>
    );
};

export const PendingInvitationStepButtons = ({ onNext }: OnboardingProps) => {
    return (
        <div className="w-full flex justify-end">
            <Button size="large" color="norm" onClick={onNext}>
                {c('Onboarding Action').t`Continue`}
            </Button>
        </div>
    );
};
