import React, { useState } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import tinycolor from 'tinycolor2';
import { Icon } from '../icon';
import { Dropdown, DropdownButton } from '../dropdown';
import { generateUID } from '../../helpers';
import ColorSelector from '../color/ColorSelector';
import { usePopperAnchor } from '../popper';

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
            <DropdownButton ref={anchorRef} isOpen={isOpen} onClick={toggle} hasCaret>
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
