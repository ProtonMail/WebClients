import type { CSSProperties, ReactNode, RefObject } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { IconProps } from '@proton/components/components/icon/Icon';
import type { IconSize } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

import './CircleButton.scss';

type CircleButtonVariant = 'default' | 'active' | 'danger' | 'transparent' | 'highlight';
type IndicatorStatus = 'warning' | 'default' | 'success' | 'danger';

interface CircleButtonProps {
    IconComponent: (props: Pick<IconProps, 'viewBox' | 'size'>) => JSX.Element;
    onClick?: () => void;
    className?: string;
    indicatorContent?: string | ReactNode;
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
            tooltipClassName="meet-tooltip bg-strong color-norm"
            tooltipStyle={{ '--meet-tooltip-bg': 'var(--background-strong)' }}
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
                            'indicator rounded-full flex justify-center items-center absolute h-custom w-custom top-custom right-custom',
                            `indicator-${indicatorStatus}`,
                            (typeof indicatorContent !== 'string' || (indicatorContent as string).length > 1) &&
                                'text-xs'
                        )}
                        style={{
                            '--top-custom': '-0.25rem',
                            '--right-custom': '-0.25rem',
                            '--w-custom': '1.5rem',
                            '--h-custom': '1.5rem',
                        }}
                    >
                        {indicatorContent}
                    </div>
                )}
            </Button>
        </Tooltip>
    );
};
