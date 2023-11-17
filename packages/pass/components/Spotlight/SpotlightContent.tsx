import type { ElementType } from 'react';
import { type MouseEvent, type VFC, useMemo } from 'react';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import './SpotlightContent.scss';

export type SpotlightMessageDefinition = {
    action?: { label: string; onClick: (e: MouseEvent<HTMLElement>) => void; type: 'link' | 'button' };
    className?: string;
    dense?: boolean;
    icon?: ElementType;
    id: string;
    message: string;
    title: string;
    weak?: boolean;
    onClose?: () => void;
};

type Props = SpotlightMessageDefinition;

export const SpotlightContent: VFC<Props> = ({
    action,
    className,
    dense = true,
    icon,
    message,
    title,
    weak,
    onClose,
}) => {
    const actionNode = useMemo(() => {
        switch (action?.type) {
            case 'link':
                return (
                    <button onClick={action.onClick} className="unstyled text-sm color-invert px-3">
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
                        className="text-sm px-3"
                        onClick={action.onClick}
                        style={{ backgroundColor: 'var(--interaction-norm-major-3)' }}
                    >
                        {action.label}
                    </Button>
                );
        }
    }, [action]);

    const CustomIcon = icon;

    return (
        <div
            className={clsx(
                `pass-spotlight-content flex items-center gap-4 p-4 pr-6 rounded relative mt-2`,
                className,
                weak && 'weak'
            )}
        >
            {onClose && (
                <Button icon shape="ghost" color="weak" size="small" className="absolute top right" onClick={onClose}>
                    <Icon name="cross" color="var(--interaction-norm-contrast)" />
                </Button>
            )}

            <div className="flex-item-fluid">
                <strong className={clsx('block', !weak && 'color-invert')}>{title}</strong>
                <span className={clsx('block text-sm', !weak && 'color-invert')}>{message}</span>
                {!dense && <div className="mt-2">{actionNode}</div>}
            </div>

            {CustomIcon && (
                <div {...(dense ? { style: { order: -1 } } : { className: 'mr-2' })}>
                    <CustomIcon />
                </div>
            )}

            {dense && actionNode}
        </div>
    );
};
