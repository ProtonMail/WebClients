import type { ThemeTypes } from '@proton/shared/lib/themes/themes';
import clsx from '@proton/utils/clsx';

import ThemeCard from './ThemeCard';
import type { ThemeSvgColors, ThemeSvgSize } from './ThemeSvg';

export interface Theme {
    label: string;
    identifier: ThemeTypes;
    thumbColors: ThemeSvgColors;
}

interface Props {
    themeIdentifier: ThemeTypes;
    onChange: (themeType: ThemeTypes) => void;
    className?: string;
    disabled?: boolean;
    list: Theme[];
    size?: ThemeSvgSize;
}

export const getThemeCardSize = (size: ThemeSvgSize) => {
    if (size === 'small') {
        return {
            minGridTemplateColumnSize: 4,
            gridGap: 2,
        };
    }

    if (size === 'medium-wide') {
        return {
            minGridTemplateColumnSize: 6,
            gridGap: 4,
        };
    }

    if (size === 'medium') {
        return {
            minGridTemplateColumnSize: 4,
            gridGap: 4,
        };
    }

    // size === 'large'
    return {
        minGridTemplateColumnSize: 9,
        gridGap: 4,
    };
};

const ThemeCards = ({ themeIdentifier, onChange, disabled, className, list, size = 'medium-wide' }: Props) => {
    const { minGridTemplateColumnSize, gridGap } = getThemeCardSize(size);

    return (
        <ul
            className={clsx('unstyled m-0 grid-auto-fill', `gap-${gridGap}`, className)}
            style={{ '--min-grid-template-column-size': `${minGridTemplateColumnSize}rem` }}
        >
            {list.map(({ identifier, label, thumbColors }) => {
                const id = `id_${identifier}`;
                return (
                    <li key={label}>
                        <ThemeCard
                            label={label}
                            id={id}
                            size={size}
                            colors={thumbColors}
                            selected={themeIdentifier === identifier}
                            onChange={() => onChange(identifier)}
                            disabled={disabled}
                            data-testid={`theme-card:theme-${label}`}
                        />
                    </li>
                );
            })}
        </ul>
    );
};

export default ThemeCards;
