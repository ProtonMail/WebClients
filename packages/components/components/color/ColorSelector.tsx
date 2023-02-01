import tinycolor from 'tinycolor2';
import { c } from 'ttag';

import { genAccentShades } from '@proton/colors';
import useInstance from '@proton/hooks/useInstance';
import generateUID from '@proton/shared/lib/helpers/generateUID';
import capitalize from '@proton/utils/capitalize';

import { classnames } from '../../helpers';

interface Props {
    selected: string;
    onChange: (color: string) => void;
    className?: string;
    colors: { value: string; label?: string }[];
    inline?: boolean;
}

const ColorSelector = ({ selected, onChange, className, colors, inline = false }: Props) => {
    const uid = useInstance(() => generateUID('color-selector'));

    return (
        <ul
            aria-label={c('Label').t`Colors`}
            className={classnames([
                'color-selector-container unstyled m0',
                inline && 'color-selector-container-inline',
                className,
            ])}
        >
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
