import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { noop } from 'proton-shared/lib/helpers/function';
import { Button } from 'react-components';
import { ChromePicker } from 'react-color';
import tinycolor from 'tinycolor2';

import './ColorPicker.scss';

const ColorPicker = ({ children, color, onChange, ...rest }) => {
    const [display, setDisplay] = useState(false);
    const colorModel = tinycolor(color);
    const backgroundColor = colorModel.isValid() ? colorModel.toHexString() : '';
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
            <Button onClick={handleClick} style={{ backgroundColor }} {...rest}>
                {children}
            </Button>
            {display ? picker : null}
        </div>
    );
};

ColorPicker.propTypes = {
    children: PropTypes.node.isRequired,
    color: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({ r: PropTypes.number, g: PropTypes.number, b: PropTypes.number, a: PropTypes.number })
    ]),
    onChange: PropTypes.func
};

ColorPicker.defaultProps = {
    color: 'blue',
    onChange: noop
};

export default ColorPicker;
