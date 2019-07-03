import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Input } from 'react-components';
import { LABEL_COLORS } from 'proton-shared/lib/constants';

import './ColorSelector.scss';

const ColorSelector = ({ selected, onChange, className, colors }) => {
    const getClass = (className, more) => {
        return [className, more].filter(Boolean).join(' ');
    };
    return (
        <ul className={getClass('ColorSelector-container unstyled', className)}>
            {colors.map((color, i) => {
                return (
                    <li
                        key={'mykey' + i}
                        className={getClass('ColorSelector-item', selected === color && 'selected')}
                        style={{ color }}
                    >
                        <Input
                            type="radio"
                            onChange={onChange(color)}
                            value={color}
                            name="paletteColor"
                            aria-labelledby={`Color ${color}`}
                            className="ColorSelector-input-color"
                        />
                        <div className="ColorSelector-item-mask">
                            <Icon name="on" className="mauto" fill="none" />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

ColorSelector.propTypes = {
    colors: PropTypes.array.isRequired,
    selected: PropTypes.string,
    className: PropTypes.string,
    onChange: PropTypes.func.isRequired
};

ColorSelector.defaultProps = {
    colors: LABEL_COLORS
};

export default ColorSelector;
