import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { type FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import './SpotlightGradient.scss';

type Props = {
    title: ReactNode;
    message: ReactNode;
    onClose: () => void;
    action?: {
        label: ReactNode;
        onClick: () => void;
    };
    className?: string;
};

export const SpotlightGradient: FC<Props & ComponentPropsWithoutRef<'div'>> = ({
    title,
    message,
    onClose,
    action,
    className,
    ...rest
}) => {
    return (
        <div
            className={clsx(
                className,
                `pass-spotlight-gradient flex items-center gap-4 p-4 pr-6 rounded relative mt-2`
            )}
            {...rest}
        >
            <Button
                icon
                pill
                shape="ghost"
                color="weak"
                size="small"
                className="absolute top-0 right-0"
                onClick={onClose}
            >
                <Icon name="cross" className="pass-spotlight-gradient--close-icon" alt={c('Action').t`Close`} />
            </Button>

            <div className="flex-1">
                <strong className="pass-spotlight-gradient--text block">{title}</strong>
                <span className="pass-spotlight-gradient--text block text-sm">{message}</span>
                {action && (
                    <Button
                        pill
                        shape="ghost"
                        color="weak"
                        size="small"
                        className="pass-spotlight-gradient--button text-sm px-3 mt-2"
                        onClick={action.onClick}
                    >
                        {action.label}
                    </Button>
                )}
            </div>
        </div>
    );
};
