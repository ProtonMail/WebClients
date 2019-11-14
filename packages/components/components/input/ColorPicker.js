import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { noop } from 'proton-shared/lib/helpers/function';
import { Icon, Dropdown, DropdownButton, generateUID, usePopperAnchor, ColorSelector } from 'react-components';
import tinycolor from 'tinycolor2';

const ColorPicker = ({ color = 'blue', onChange = noop }) => {
    const colorModel = tinycolor(color);
    const iconColor = colorModel.isValid() ? colorModel.toHexString() : '';

    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor();

    const handleChange = (color) => () => onChange({ hex: color });

    return (
        <>
            <DropdownButton buttonRef={anchorRef} isOpen={isOpen} onClick={toggle} hasCaret={true}>
                <Icon className="flex-item-noshrink" name="circle" color={iconColor} />
            </DropdownButton>
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <ColorSelector
                    selected={color}
                    onChange={handleChange}
                    className="p1 pt0-5 pb0-5 flex flex-row flex-wrap flex-spacearound"
                />
            </Dropdown>
        </>
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
