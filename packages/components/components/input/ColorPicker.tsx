import React, { useState } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import tinycolor from 'tinycolor2';
import { Icon, Dropdown, DropdownButton, generateUID, usePopperAnchor, ColorSelector } from '../../index';

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
            <DropdownButton buttonRef={anchorRef} isOpen={isOpen} onClick={toggle} hasCaret>
                <Icon className="flex-item-noshrink" name="circle" color={iconColor} />
            </DropdownButton>
            <Dropdown id={uid} isOpen={isOpen} noMaxSize anchorRef={anchorRef} onClose={close}>
                <ColorSelector
                    selected={color}
                    onChange={onChange}
                    className="flex flex-row flex-wrap flex-justify-center m0 p1 "
                />
            </Dropdown>
        </>
    );
};

export default ColorPicker;
