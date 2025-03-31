import type { ReactNode } from 'react';
import { type FC } from 'react';

import { c } from 'ttag';

import { Button, type ButtonLikeShape } from '@proton/atoms';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import './SpotlightGradient.scss';

type Props = {
    action?: {
        label: ReactNode;
        onClick: () => void;
    };
    className?: string;
    message: ReactNode;
    title: ReactNode;
    backgroundImage?: string;
    onClose: () => void;
    closeButtonStyle?: {
        shape?: ButtonLikeShape;
        className?: string;
    };
    withArrow?: boolean;
};

export const SpotlightGradient: FC<Props> = ({
    action,
    backgroundImage,
    className,
    message,
    title,
    onClose,
    closeButtonStyle,
    withArrow,
}) => {
    return (
        <div
            className={clsx(
                className,
                'pass-spotlight-gradient flex items-center gap-4 p-4 pr-6 rounded relative mt-2',
                backgroundImage && 'pass-spotlight-gradient--image',
                withArrow && 'pass-spotlight-gradient--with-arrow'
            )}
            style={
                backgroundImage
                    ? { '--spotlight-gradient-image': `url("${backgroundImage}") no-repeat right top` }
                    : undefined
            }
        >
            <div className="flex-1">
                <div className="flex justify-space-between">
                    <strong className="pass-spotlight-gradient--text block">{title}</strong>
                    <Button
                        icon
                        pill
                        shape={closeButtonStyle?.shape ?? 'ghost'}
                        className={closeButtonStyle?.className ?? 'absolute top-0 right-0'}
                        color="weak"
                        size="small"
                        onClick={onClose}
                    >
                        <Icon name="cross" className="pass-spotlight-gradient--close-icon" alt={c('Action').t`Close`} />
                    </Button>
                </div>
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
