import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-components';
import { ChromePicker } from 'react-color';
import './ColorPicker.scss';

const ColorPicker = ({ text, initialRgbaColor, onColorChange, ...rest }) => {
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
    };

    const picker = (
        <div className="popover">
            <div className="cover" onClick={handleClose} />
            <ChromePicker color={rgbaColor} onChange={handleChange} />
        </div>
    );

    useEffect(() => {
        if (onColorChange) {
            onColorChange();
        }
    }, [rgbaColor]);

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
    onColorChange: PropTypes.func
};

ColorPicker.defaultProps = {
    text: '',
    initialRgbaColor: { r: 255, g: 255, b: 255, a: 1 } // white
};

export default ColorPicker;
