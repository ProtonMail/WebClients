import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import clsx from '@proton/utils/clsx';

import './BackgroundTile.scss';

interface BackgroundTileProps {
    label: string;
    isSelected: boolean;
    onClick: () => void;
    isPending?: boolean;
    disabled?: boolean;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
}

export const BackgroundTile = ({
    label,
    isSelected,
    onClick,
    isPending = false,
    disabled,
    style,
    className,
    children,
}: BackgroundTileProps) => {
    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <button
            type="button"
            role="option"
            aria-selected={isSelected}
            aria-busy={isPending}
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className={clsx(
                'background-tile flex items-center justify-center w-full ratio-16/9 rounded-lg border border-2 color-norm transition-all',
                isSelected ? 'border-currentcolor' : 'border-transparent',
                disabled && 'opacity-50',
                className
            )}
            style={style}
        >
            {isPending ? <CircleLoader /> : children}
        </button>
    );
};
