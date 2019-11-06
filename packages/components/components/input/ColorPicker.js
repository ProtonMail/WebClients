import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { noop } from 'proton-shared/lib/helpers/function';
import { Icon, DropdownButton } from 'react-components';
import { ChromePicker } from 'react-color';
import tinycolor from 'tinycolor2';

import './ColorPicker.scss';

const ColorPicker = ({ color = 'blue', onChange = noop, ...rest }) => {
    const [display, setDisplay] = useState(false);
    const colorModel = tinycolor(color);
    const iconColor = colorModel.isValid() ? colorModel.toHexString() : '';
    const handleClick = () => setDisplay(!display);
    const handleClose = () => setDisplay(false);

    const picker = (
        <div className="popover">
            <div className="cover" onClick={handleClose} />
            <ChromePicker color={color} onChange={onChange} />
        </div>
    );

    return (
        <div className="relative">
            <DropdownButton onClick={handleClick} hasCaret={true} {...rest}>
                <Icon className="flex-item-noshrink" name="circle" color={iconColor} />
            </DropdownButton>
            {display ? picker : null}
        </div>
    );
};

ColorPicker.propTypes = {
    className: PropTypes.string,
    color: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({ r: PropTypes.number, g: PropTypes.number, b: PropTypes.number, a: PropTypes.number })
    ]),
    onChange: PropTypes.func
};

export default ColorPicker;
