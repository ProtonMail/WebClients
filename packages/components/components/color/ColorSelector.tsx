import React from 'react';
import { LABEL_COLORS } from 'proton-shared/lib/constants';
import Input from '../input/Input';
import { Icon } from '../icon';

import { classnames } from '../../helpers';

interface Props {
    selected: string;
    onChange: (color: string) => void;
    className?: string;
    colors?: string[];
}

const ColorSelector = ({ selected, onChange, className, colors = LABEL_COLORS }: Props) => {
    return (
        <ul className={classnames(['color-selector-container unstyled', className])}>
            {colors.map((color, i) => {
                const isSelected = selected?.toLowerCase() === color?.toLowerCase();
                return (
                    <li
                        key={`mykey${i}`}
                        className={classnames(['color-selector-item', isSelected && 'is-selected'])}
                        style={{ color }}
                    >
                        <Input
                            type="radio"
                            onChange={() => onChange(color)}
                            value={color}
                            name="paletteColor"
                            aria-labelledby={`Color ${color}`}
                            className="color-selector-input-color"
                            data-test-id={`color-selector:${color}`}
                        />
                        <div className="color-selector-item-mask">
                            <Icon name="on" className="mauto" />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default ColorSelector;
