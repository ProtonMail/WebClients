import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { noop } from 'proton-shared/lib/helpers/function';
import { Button } from 'react-components';
import { ChromePicker } from 'react-color';
import './ColorPicker.scss';

const ColorPicker = ({ text, initialRgbaColor, onChange, ...rest }) => {
    const [display, setDisplay] = useState(false);
    const [rgbaColor, setRgbaColor] = useState(initialRgbaColor);

    const rgbaColorString = (rgbaColor) => {
        return `rgba(${rgbaColor.r}, ${rgbaColor.g}, ${rgbaColor.b}, ${rgbaColor.a})`;
    };
    const handleClick = () => {
        setDisplay(!display);
    };
    const handleClose = () => {
        setDisplay(false);
    };
    const handleChange = (color) => {
        setRgbaColor(color.rgb);
        onChange(color);
    };

    const picker = (
        <div className="popover">
            <div className="cover" onClick={handleClose} />
            <ChromePicker color={rgbaColor} onChange={handleChange} />
        </div>
    );

    return (
        <div className="relative">
            <Button onClick={handleClick} style={{ backgroundColor: rgbaColorString(rgbaColor) }} {...rest}>
                {text}
            </Button>
            {display ? picker : null}
        </div>
    );
};

ColorPicker.propTypes = {
    text: PropTypes.string,
    initialRgbaColor: PropTypes.object,
    onChange: PropTypes.func
};

ColorPicker.defaultProps = {
    text: '',
    initialRgbaColor: { r: 255, g: 255, b: 255, a: 1 }, // white
    onChange: noop
};

export default ColorPicker;
