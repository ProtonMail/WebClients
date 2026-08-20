import type { CSSProperties, ReactNode, RefObject } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import type { PopperPlacement } from '@proton/atoms/Popper/interface';
import type { IconProps } from '@proton/components/components/icon/Icon';
import type { IconSize } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

import { ConditionalTooltip } from '../ConditionalTooltip/ConditionalTooltip';

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
    ariaPressed?: boolean;
    ariaExpanded?: boolean;
    ariaHasPopup?: React.AriaAttributes['aria-haspopup'];
    noBorder?: boolean;
    tooltipTitle?: string;
    tooltipClassName?: string;
    tooltipPlacement?: PopperPlacement;
    anchorRef?: RefObject<HTMLButtonElement>;
    size?: IconSize;
    buttonStyle?: CSSProperties;
    disabled?: boolean;
    loading?: boolean;
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
    ariaPressed,
    ariaExpanded,
    ariaHasPopup,
    noBorder = true,
    tooltipTitle,
    tooltipClassName,
    tooltipPlacement,
    anchorRef,
    size = 6,
    buttonStyle,
    disabled = false,
    loading = false,
}: CircleButtonProps) => {
    const getToggleIcon = () => {
        if (loading) {
            return (
                <CircleLoader
                    className="w-custom h-custom"
                    style={{ '--w-custom': '1.5rem', '--h-custom': '1.5rem', '--stroke-width': 1.3 }}
                />
            );
        }

        return <IconComponent viewBox={iconViewPort} size={size} />;
    };

    return (
        <ConditionalTooltip
            title={tooltipTitle}
            placement={tooltipPlacement}
            tooltipClassName={clsx('meet-tooltip bg-strong color-norm', tooltipClassName)}
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
                aria-pressed={ariaPressed}
                aria-expanded={ariaExpanded}
                aria-haspopup={ariaHasPopup}
                ref={anchorRef}
                style={buttonStyle}
                disabled={disabled || loading}
            >
                {getToggleIcon()}
                {indicatorContent && (
                    <div
                        className={clsx(
                            'indicator rounded-full flex justify-center items-center absolute h-custom w-custom top-custom right-custom',
                            `indicator-${indicatorStatus}`
                        )}
                        style={{
                            '--top-custom': '-0.25rem',
                            '--right-custom': '-0.25rem',
                            '--w-custom': '1.5rem',
                            '--h-custom': '1.5rem',
                            fontSize: '0.5625rem',
                        }}
                    >
                        {indicatorContent}
                    </div>
                )}
            </Button>
        </ConditionalTooltip>
    );
};
