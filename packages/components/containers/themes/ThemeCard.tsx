import { c } from 'ttag';

import { Button } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import ThemeSvg, { ThemeSvgColors, ThemeSvgSize } from './ThemeSvg';

import './ThemeCard.scss';

interface Props {
    label: string;
    id: string;
    size?: ThemeSvgSize;
    colors: ThemeSvgColors;
    selected?: boolean;
    onChange?: () => void;
    disabled?: boolean;
    as?: React.ElementType;
    className?: string;
    borderRadius?: 'sm' | 'md';
    'data-testid'?: string;
}

const ThemeCard = ({
    label,
    id,
    size,
    colors,
    selected,
    onChange,
    disabled,
    borderRadius = 'md',
    as: Component = Button,
    className,
    'data-testid': dataTestId,
}: Props) => {
    return (
        <Component
            name="themeCard"
            shape="outline"
            color={selected ? 'norm' : 'weak'}
            id={id}
            className={clsx(
                'theme-card-button p-0 flex flex-nowrap flex-column gap-1 flex-align-items-center',
                selected && 'is-active no-pointer-events text-bold',
                Component === Button && 'w100 interactive-pseudo',
                borderRadius === 'sm' && 'rounded-sm',
                borderRadius === 'md' && 'rounded',
                `theme-card-button-${size}`,
                className
            )}
            aria-pressed={Component === Button ? selected : undefined}
            onClick={onChange}
            disabled={disabled}
            type={Component === Button ? 'button' : undefined}
            aria-label={c('Action').t`Use ${label} theme`}
            title={c('Action').t`Use ${label} theme`}
            data-testid={dataTestId}
        >
            <ThemeSvg className={clsx('block theme-card-image on-rtl-mirror')} size={size} colors={colors} />
            <span
                className={clsx(
                    size === 'small' && 'sr-only',
                    size === 'medium' && 'sr-only',
                    size === 'medium-wide' && 'text-sm'
                )}
            >
                {label}
            </span>
        </Component>
    );
};

export default ThemeCard;
