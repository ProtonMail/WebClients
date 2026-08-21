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
    ariaPressed?: boolean;
    iconOnTheRight?: boolean;
    className?: string;
    disabled?: boolean;
    rightContent?: React.ReactNode;
}

const CheckComponent = ({
    showIcon,
    Icon,
    iconSize,
    iconOnTheRight,
    loading,
}: {
    showIcon: boolean;
    Icon: (props: Pick<IconProps, 'size' | 'style'>) => JSX.Element;
    iconSize?: IconProps['size'];
    iconOnTheRight?: boolean;
    loading?: boolean;
}) => {
    return (
        <div
            className={clsx(
                'flex items-center justify-center w-custom min-w-custom w-4',
                iconOnTheRight ? 'ml-2' : 'mr-2'
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
};

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
    ariaPressed,
    iconOnTheRight = false,
    className,
    disabled = false,
    rightContent,
}: OptionButtonProps) => {
    return (
        <Button
            className={clsx(
                'option-button flex items-center justify-start flex-nowrap text-rg meet-font-weight rounded-lg',
                className
            )}
            onClick={onClick}
            shape="ghost"
            role={role}
            aria-selected={ariaSelected}
            aria-pressed={ariaPressed}
            disabled={disabled}
        >
            {!iconOnTheRight && (
                <CheckComponent showIcon={showIcon} Icon={Icon} iconSize={iconSize} loading={loading} />
            )}
            {description ? (
                <div className="flex flex-column flex-nowrap flex-1 min-w-0 text-left p-3">
                    <LabelAndDescription
                        label={label}
                        description={description}
                        labelColor={showIcon ? 'color-norm' : 'color-weak'}
                        descriptionColor={showIcon ? 'color-norm' : 'color-weak'}
                        size="medium"
                    />
                </div>
            ) : (
                <TruncatedTextWithTooltip label={label} className="mr-4" />
            )}
            {iconOnTheRight && <CheckComponent showIcon={showIcon} Icon={Icon} iconSize={iconSize} loading={loading} />}
            {rightContent}
        </Button>
    );
};
