import { ThemeTypes } from '@proton/shared/lib/themes/themes';
import clsx from '@proton/utils/clsx';

import ThemeCard from './ThemeCard';
import { ThemeSvgColors, ThemeSvgSize } from './ThemeSvg';

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

const ThemeCards = ({ themeIdentifier, onChange, disabled, className, list, size = 'medium' }: Props) => {
    const { minGridTemplateColumnSize, gridGap } = (() => {
        if (size === 'small') {
            return {
                minGridTemplateColumnSize: 3,
                gridGap: 2,
            };
        }

        if (size === 'medium') {
            return {
                minGridTemplateColumnSize: 6,
                gridGap: 4,
            };
        }

        // size === 'large'
        return {
            minGridTemplateColumnSize: 8.25,
            gridGap: 4,
        };
    })();

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
                        />
                    </li>
                );
            })}
        </ul>
    );
};

export default ThemeCards;
