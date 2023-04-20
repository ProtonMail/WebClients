import { type MouseEvent, type VFC } from 'react';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import { OnboardingShieldIcon } from './OnboardingIcon';

import './OnboardingContent.scss';

export type OnboardingMessageDefinition = {
    className: string;
    title: string;
    message: string;
    action?: { label: string; onClick: (e: MouseEvent<HTMLElement>) => void };
};

type Props = OnboardingMessageDefinition & { onClose: () => void };

export const OnboardingContent: VFC<Props> = ({ title, message, className, action, onClose }) => {
    return (
        <div
            className={clsx(
                `pass-onboarding-content flex flex-align-items-center gap-4 p-3 rounded relative mt-2`,
                className
            )}
        >
            <Button icon shape="ghost" color="weak" size="small" className="absolute top right" onClick={onClose}>
                <Icon name="cross" color="var(--interaction-norm-contrast)" />
            </Button>

            <OnboardingShieldIcon />

            <div className="flex-item-fluid">
                <strong className="block color-invert text-md">{title}</strong>
                <span className="block color-invert text-sm">{message}</span>
            </div>

            {action && (
                <button onClick={action.onClick} className="unstyled text-sm color-invert mr-6">
                    <Icon name="arrow-out-square" /> <span className="text-underline">{action.label}</span>
                </button>
            )}
        </div>
    );
};
