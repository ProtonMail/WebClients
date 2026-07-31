import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import type { IconProps } from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import { LabelAndDescription } from '../LabelAndDescription/LabelAndDescription';
import { TruncatedTextWithTooltip } from '../TruncatedTextWithTooltip/TruncatedTextWithTooltip';

import './OptionButton.scss';

interface OptionButtonProps {
    showIcon: boolean;
    label: string;
    description?: string;
    onClick: () => void;
    Icon: (props: Pick<IconProps, 'size' | 'style'>) => JSX.Element;
    iconSize?: IconProps['size'];
    loading?: boolean;
    role?: string;
    ariaSelected?: boolean;
    iconOnTheRight?: boolean;
    className?: string;
    disabled?: boolean;
}

export const OptionButton = ({
    showIcon,
    label,
    description,
    onClick,
    Icon,
    iconSize,
    loading,
    role,
    ariaSelected,
    iconOnTheRight = false,
    className,
    disabled = false,
}: OptionButtonProps) => {
    const CheckComponent = (
        <div
            className={clsx(
                'flex items-center justify-center w-custom min-w-custom w-4',
                iconOnTheRight ? 'ml-2 icon-on-the-right' : 'mr-2 icon-on-the-left'
            )}
            style={{ '--w-custom': '2rem', '--min-w-custom': '2rem' }}
        >
            {loading ? (
                <CircleLoader />
            ) : (
                showIcon && Icon && <Icon size={iconSize ?? 5} style={{ color: 'var(--text-weak)' }} />
            )}
        </div>
    );

    return (
        <Button
            className={clsx(
                'option-button w-full max-w-custom flex items-center justify-start flex-nowrap pl-0 text-rg meet-font-weight rounded-xl pr-2',
                className
            )}
            onClick={onClick}
            shape="ghost"
            style={{ '--max-w-custom': '25rem' }}
            role={role}
            aria-selected={ariaSelected}
            disabled={disabled}
        >
            {!iconOnTheRight && CheckComponent}
            {description ? (
                <div className="flex flex-column flex-nowrap flex-1 min-w-0 text-left p-3">
                    <LabelAndDescription
                        label={label}
                        description={description}
                        labelColor={showIcon ? 'color-norm' : 'color-weak'}
                        descriptionColor={showIcon ? 'color-norm' : 'color-weak'}
                    />
                </div>
            ) : (
                <TruncatedTextWithTooltip label={label} />
            )}
            {iconOnTheRight && CheckComponent}
        </Button>
    );
};
