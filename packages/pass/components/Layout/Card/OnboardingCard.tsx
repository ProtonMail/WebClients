import type { FC } from 'react';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

import './OnboardingCard.scss';

export type OnboardingCardProps = {
    imageSrc: string;
    title: string;
    description?: string;
    onClick?: () => void;
    className?: string;
};

export const OnboardingCard: FC<OnboardingCardProps> = ({ imageSrc, title, description, onClick, className }) => (
    <Button
        shape="ghost"
        color="weak"
        onClick={onClick}
        className={clsx('flex items-center flex-nowrap gap-4 onboarding-card', className)}
    >
        <img src={imageSrc} alt="" className="shrink-0" />
        <div className="flex flex-column gap-1 py-2 text-left">
            <div className="text-lg text-bold">
                {title} <Icon name="arrow-right" />
            </div>
            <div className="color-weak">{description}</div>
        </div>
    </Button>
);
