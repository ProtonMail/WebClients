import React, { useState } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import { Icon, Dropdown, DropdownButton, generateUID, usePopperAnchor, ColorSelector } from '../../index';
import tinycolor from 'tinycolor2';

interface Props {
    color: string;
    onChange: (color: string) => void;
}

const ColorPicker = ({ color = 'blue', onChange = noop }: Props) => {
    const colorModel = tinycolor(color) as any;
    const iconColor = colorModel.isValid() ? colorModel.toHexString() : '';

    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton buttonRef={anchorRef} isOpen={isOpen} onClick={toggle} hasCaret={true}>
                <Icon className="flex-item-noshrink" name="circle" color={iconColor} />
            </DropdownButton>
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <ColorSelector
                    selected={color}
                    onChange={onChange}
                    className="p1 pt0-5 pb0-5 flex flex-row flex-wrap"
                />
            </Dropdown>
        </>
    );
};

export default ColorPicker;
