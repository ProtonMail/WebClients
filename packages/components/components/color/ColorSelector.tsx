import tinycolor from 'tinycolor2';

import generateUID from '@proton/shared/lib/helpers/generateUID';
import capitalize from '@proton/utils/capitalize';
import { genAccentShades } from '@proton/colors';

import useInstance from '@proton/hooks/useInstance';
import { classnames } from '../../helpers';

interface Props {
    selected: string;
    onChange: (color: string) => void;
    className?: string;
    colors: { value: string; label?: string }[];
}

const ColorSelector = ({ selected, onChange, className, colors }: Props) => {
    const uid = useInstance(() => generateUID('color-selector'));

    return (
        <ul className={classnames(['color-selector-container unstyled', className])}>
            {colors.map(({ value: color, label }) => {
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
                            title={capitalize(label) || color}
                        >
                            <input
                                type="radio"
                                name={uid}
                                value={color}
                                className="color-selector-input"
                                data-test-id={`color-selector:${color}`}
                                aria-labelledby={`Color ${color}`}
                                onChange={() => onChange(color)}
                                autoFocus={isSelected}
                            />
                            <span className="sr-only">{label || color}</span>
                        </label>
                    </li>
                );
            })}
        </ul>
    );
};

export default ColorSelector;
