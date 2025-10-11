import type { CSSProperties, RefObject } from 'react';

import { Button, Tooltip } from '@proton/atoms';
import type { IconProps } from '@proton/components/components/icon/Icon';
import type { IconSize } from '@proton/icons/types';
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
    tooltipTitle?: string;
    anchorRef?: RefObject<HTMLButtonElement>;
    size?: IconSize;
    buttonStyle?: CSSProperties;
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
    tooltipTitle,
    anchorRef,
    size = 6,
    buttonStyle,
}: CircleButtonProps) => {
    return (
        <Tooltip
            title={tooltipTitle}
            tooltipClassName="circle-button-tooltip bg-strong color-norm"
            isOpen={tooltipTitle ? undefined : false}
            openDelay={750}
            closeDelay={0}
        >
            <Button
                className={clsx(
                    'circle-button',
                    `circle-button-${variant}`,
                    'user-select-none color-norm rounded-full gap-2 relative',
                    noBorder && 'border-none',
                    className
                )}
                onClick={onClick}
                aria-label={ariaLabel}
                ref={anchorRef}
                style={buttonStyle}
            >
                <IconComponent viewBox={iconViewPort} size={size} />
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
        </Tooltip>
    );
};
