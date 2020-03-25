import React from 'react';
import { Icon, Input } from '../../index';
import { LABEL_COLORS } from 'proton-shared/lib/constants';

import './ColorSelector.scss';
import { classnames } from '../../helpers/component';

interface Props {
    selected: string;
    onChange: (color: string) => void;
    className?: string;
    colors?: string[];
}

const ColorSelector = ({ selected, onChange, className, colors = LABEL_COLORS }: Props) => {
    return (
        <ul className={classnames(['ColorSelector-container unstyled', className])}>
            {colors.map((color, i) => {
                return (
                    <li
                        key={'mykey' + i}
                        className={classnames(['ColorSelector-item', selected === color && 'selected'])}
                        style={{ color }}
                    >
                        <Input
                            type="radio"
                            onChange={() => onChange(color)}
                            value={color}
                            name="paletteColor"
                            aria-labelledby={`Color ${color}`}
                            className="ColorSelector-input-color"
                            data-test-id={`color-selector:${color}`}
                        />
                        <div className="ColorSelector-item-mask">
                            <Icon name="on" className="mauto" />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default ColorSelector;
