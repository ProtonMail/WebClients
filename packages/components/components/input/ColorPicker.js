import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { noop } from 'proton-shared/lib/helpers/function';
import { Button, Icon } from 'react-components';
import { ChromePicker } from 'react-color';
import tinycolor from 'tinycolor2';

import './ColorPicker.scss';
import { classnames } from '../../helpers/component';

const ColorPicker = ({ color = 'blue', onChange = noop, className = '', ...rest }) => {
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

    // TODO replace alias by proper icon (circle)
    return (
        <div className="relative">
            <Button className={classnames(['pm-button--for-icon', className])} onClick={handleClick} {...rest}>
                <Icon className="flex-item-noshrink" name="alias" color={iconColor} />
            </Button>
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
