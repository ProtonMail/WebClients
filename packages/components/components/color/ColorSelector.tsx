import tinycolor from 'tinycolor2';

import generateUID from '@proton/shared/lib/helpers/generateUID';
import { ACCENT_COLORS } from '@proton/shared/lib/constants';
import { genAccentShades } from '@proton/colors';

import { classnames } from '../../helpers';
import { useInstance } from '../..';

interface Props {
    selected: string;
    onChange: (color: string) => void;
    className?: string;
    colors?: string[];
}

const ColorSelector = ({ selected, onChange, className, colors = ACCENT_COLORS }: Props) => {
    const uid = useInstance(() => generateUID('color-selector'));

    return (
        <ul className={classnames(['color-selector-container unstyled', className])}>
            {colors.map((color, index) => {
                const isSelected = selected?.toLowerCase() === color?.toLowerCase();

                const [base, hover, selectedColor] = genAccentShades(tinycolor(color)).map((c) => c.toHexString());

                return (
                    <li key={color}>
                        <label
                            className={classnames(['color-selector-item', isSelected && 'is-selected'])}
                            style={{
                                color,
                                '--color-selector-base': base,
                                '--color-selector-strong': hover,
                                '--color-selector-intense': selectedColor,
                            }}
                            title={base}
                        >
                            <input
                                type="radio"
                                name={uid}
                                value={color}
                                className="color-selector-input"
                                data-test-id={`color-selector:${color}`}
                                aria-labelledby={`Color ${color}`}
                                onChange={() => onChange(color)}
                                autoFocus={index === 0}
                            />
                            <span className="sr-only">{base}</span>
                        </label>
                    </li>
                );
            })}
        </ul>
    );
};

export default ColorSelector;
