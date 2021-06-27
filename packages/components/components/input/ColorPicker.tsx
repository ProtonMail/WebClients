import { useState } from 'react';
import * as React from 'react';
import { noop } from '@proton/shared/lib/helpers/function';
import tinycolor from 'tinycolor2';
import { Icon } from '../icon';
import { Dropdown, DropdownButton } from '../dropdown';
import { classnames, generateUID } from '../../helpers';
import ColorSelector from '../color/ColorSelector';
import { usePopperAnchor } from '../popper';
import { DropdownButtonProps } from '../dropdown/DropdownButton';

interface OwnProps {
    color?: string;
    onChange: (color: string) => void;
}

export type Props<T extends React.ElementType> = OwnProps & DropdownButtonProps<T>;

const ColorPicker = <T extends React.ElementType>({
    color = 'blue',
    onChange = noop,
    className,
    ...rest
}: Props<T>) => {
    const colorModel = tinycolor(color) as any;
    const iconColor = colorModel.isValid() ? colorModel.toHexString() : '';

    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                as="button"
                type="button"
                className={classnames([className, !rest.as && 'field select'])}
                hasCaret
                {...rest}
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
            >
                <Icon className="flex-item-noshrink" name="circle-filled" color={iconColor} />
            </DropdownButton>
            <Dropdown
                id={uid}
                isOpen={isOpen}
                noMaxSize
                anchorRef={anchorRef}
                onClose={close}
                disableDefaultArrowNavigation
            >
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
