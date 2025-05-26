import { Button } from '@proton/atoms';
import type { IconProps } from '@proton/components';
import clsx from '@proton/utils/clsx';

import './CircleButton.scss';

type CircleButtonVariant = 'default' | 'active' | 'danger';
type IndicatorStatus = 'warning' | 'default' | 'success';

interface CircleButtonProps {
    IconComponent: (props: Pick<IconProps, 'viewBox' | 'size'>) => JSX.Element;
    onClick?: () => void;
    className?: string;
    indicatorContent?: string;
    indicatorStatus?: IndicatorStatus;
    iconViewPort?: string;
    variant?: CircleButtonVariant;
}

export const CircleButton = ({
    IconComponent,
    onClick,
    className,
    indicatorContent,
    indicatorStatus = 'default',
    iconViewPort,
    variant = 'default',
}: CircleButtonProps) => {
    return (
        <Button
            className={clsx(
                'circle-button',
                `circle-button-${variant}`,
                'color-norm rounded-full gap-2 border-none relative',
                className
            )}
            onClick={onClick}
        >
            <IconComponent viewBox={iconViewPort} size={6} />
            {indicatorContent && (
                <div
                    className={clsx(
                        'indicator rounded-full flex justify-center items-center absolute top-0 right-0 w-custom h-custom',
                        `indicator-${indicatorStatus}`
                    )}
                    style={{ '--w-custom': '1.25rem', '--h-custom': '1.25rem' }}
                >
                    {indicatorContent}
                </div>
            )}
        </Button>
    );
};
