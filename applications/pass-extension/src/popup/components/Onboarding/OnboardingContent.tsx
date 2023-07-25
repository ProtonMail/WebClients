import { type MouseEvent, type ReactNode, type VFC, useMemo } from 'react';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import './OnboardingContent.scss';

export type OnboardingMessageDefinition = {
    className: string;
    title: string;
    message: string;
    action?: { label: string; onClick: (e: MouseEvent<HTMLElement>) => void; type: 'link' | 'button' };
    icon?: ReactNode;
};

type Props = OnboardingMessageDefinition & { onClose: () => void };

export const OnboardingContent: VFC<Props> = ({ title, message, className, icon, action, onClose }) => {
    const actionNode = useMemo(() => {
        switch (action?.type) {
            case 'link':
                return (
                    <button onClick={action.onClick} className="unstyled text-sm color-invert">
                        <span className="text-underline">{action.label}</span>
                    </button>
                );
            case 'button':
                return (
                    <Button
                        pill
                        shape="solid"
                        color="norm"
                        size="small"
                        className="text-sm"
                        onClick={action.onClick}
                        style={{ backgroundColor: 'var(--interaction-norm-major-3)' }}
                    >
                        {action.label}
                    </Button>
                );
        }
    }, [action]);

    return (
        <div
            className={clsx(
                `pass-onboarding-content flex flex-align-items-center gap-4 p-4 rounded relative mt-2`,
                className
            )}
        >
            <Button icon shape="ghost" color="weak" size="small" className="absolute top right" onClick={onClose}>
                <Icon name="cross" color="var(--interaction-norm-contrast)" />
            </Button>

            {icon}

            <div className="flex-item-fluid">
                <strong className="block color-invert text-md">{title}</strong>
                <span className="block color-invert text-sm">{message}</span>
            </div>

            <div className="mr-4">{actionNode}</div>
        </div>
    );
};
