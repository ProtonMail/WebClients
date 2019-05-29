import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Input } from 'react-components';
import { LABEL_COLORS } from 'proton-shared/lib/constants';

import './LabelColors.scss';

function LabelColors({ selected, onChange, className }) {
    const getClass = (className, more) => {
        return [className, more].filter(Boolean).join(' ');
    };
    return (
        <ul className={getClass('LabelColors-container unstyled', className)}>
            {LABEL_COLORS.map((color, i) => {
                return (
                    <li
                        key={'mykey' + i}
                        className={getClass('LabelColors-item', selected === color && 'selected')}
                        style={{ color }}
                    >
                        <Input
                            type="radio"
                            onChange={onChange(color)}
                            value={color}
                            name="paletteColor"
                            aria-labelledby={`Color ${color}`}
                            className="LabelColors-input-color"
                        />
                        <div className="LabelColors-item-mask">
                            <Icon name="on" className="mauto" fill="none" />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

LabelColors.propTypes = {
    selected: PropTypes.string,
    className: PropTypes.string,
    onChange: PropTypes.func.isRequired
};

LabelColors.defaultProps = {
    selected: ''
};

export default LabelColors;
