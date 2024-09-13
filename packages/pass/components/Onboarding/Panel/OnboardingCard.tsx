import type { FC } from 'react';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { Checkmark } from '@proton/pass/components/Onboarding/Panel/Checkmark';
import { OnboardingIcon } from '@proton/pass/components/Onboarding/Panel/OnboardingIcon';
import clsx from '@proton/utils/clsx';

import './OnboardingCard.scss';

export type OnboardingCardProps = {
    imageSrc: string;
    title: string;
    description?: string;
    onClick?: () => void;
    className?: string;
    actionDone: boolean;
};

export const OnboardingCard: FC<OnboardingCardProps> = ({
    imageSrc,
    title,
    description,
    onClick,
    className,
    actionDone,
}) => (
    <Button
        shape="ghost"
        color="weak"
        onClick={onClick}
        className={clsx(
            'flex items-center flex-nowrap onboarding-card relative border border-norm rounded-xl w-full',
            className
        )}
    >
        <div className="absolute top-0 right-0 p-2">
            <Checkmark on={actionDone} />
        </div>
        <div className="py-3 px-2 flex items-center flex-nowrap gap-4 ">
            <OnboardingIcon iconSrc={imageSrc} />

            <div className="flex flex-column gap-1 py-2 text-left">
                <div className="text-lg text-bold">
                    {title} <Icon name="arrow-right" />
                </div>
                <div className="color-weak">{description}</div>
            </div>
        </div>
    </Button>
);
