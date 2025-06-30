import { Button } from '@proton/atoms';
import type { IconProps } from '@proton/components';
import clsx from '@proton/utils/clsx';

import './CircleButton.scss';

type CircleButtonVariant = 'default' | 'active' | 'danger' | 'transparent';
type IndicatorStatus = 'warning' | 'default' | 'success' | 'danger';

interface CircleButtonProps {
    IconComponent: (props: Pick<IconProps, 'viewBox' | 'size'>) => JSX.Element;
    onClick?: () => void;
    className?: string;
    indicatorContent?: string;
    indicatorStatus?: IndicatorStatus;
    iconViewPort?: string;
    variant?: CircleButtonVariant;
    ariaLabel?: string;
    noBorder?: boolean;
}

export const CircleButton = ({
    IconComponent,
    onClick,
    className,
    indicatorContent,
    indicatorStatus = 'default',
    iconViewPort,
    variant = 'default',
    ariaLabel,
    noBorder = true,
}: CircleButtonProps) => {
    return (
        <Button
            className={clsx(
                'circle-button',
                `circle-button-${variant}`,
                'color-norm rounded-full gap-2 relative',
                noBorder && 'border-none',
                className
            )}
            onClick={onClick}
            aria-label={ariaLabel}
        >
            <IconComponent viewBox={iconViewPort} size={6} />
            {indicatorContent && (
                <div
                    className={clsx(
                        'indicator rounded-full flex justify-center items-center absolute top-custom right-custom w-custom h-custom',
                        `indicator-${indicatorStatus}`,
                        Number(indicatorContent) > 9 && 'text-xs'
                    )}
                    style={{
                        '--w-custom': '1.25rem',
                        '--h-custom': '1.25rem',
                        '--top-custom': '-0.15rem',
                        '--right-custom': '-0.15rem',
                    }}
                >
                    {indicatorContent}
                </div>
            )}
        </Button>
    );
};
