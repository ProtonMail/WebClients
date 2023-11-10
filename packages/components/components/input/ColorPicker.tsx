import { useState } from 'react';

import tinycolor from 'tinycolor2';

import { ACCENT_COLORS_MAP, getColorName } from '@proton/shared/lib/colors';
import { omit } from '@proton/shared/lib/helpers/object';
import clsx from '@proton/utils/clsx';

import { generateUID } from '../../helpers';
import ColorSelector from '../color/ColorSelector';
import { Dropdown, DropdownButton, DropdownSizeUnit } from '../dropdown';
import { DropdownButtonProps } from '../dropdown/DropdownButton';
import { Icon } from '../icon';
import { usePopperAnchor } from '../popper';

interface OwnProps {
    color?: string;
    onChange: (color: string) => void;
}

type ButtonProps = DropdownButtonProps<'button'>;

export type Props =
    | ({ layout: 'inline' } & OwnProps)
    | ({ layout?: 'dropdown' } & OwnProps & Omit<ButtonProps, 'onChange' | 'as'>);

const getOptions = () => {
    return Object.values(ACCENT_COLORS_MAP).map(({ color, getName }) => ({ value: color, label: getName() }));
};

const ColorPicker = ({ color = '#5252CC', onChange, ...rest }: Props) => {
    const options = getOptions();
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    if (rest.layout === 'inline') {
        return <ColorSelector selected={color} onChange={onChange} colors={options} inline />;
    }

    const colorModel = tinycolor(color);
    const iconColor = colorModel.isValid() ? colorModel.toHexString() : '';
    const colorName = getColorName(color);

    const { className, ...restDropdownProps } = omit(rest, ['layout']);
    return (
        <>
            <DropdownButton
                {...restDropdownProps}
                as="button"
                type="button"
                className={clsx([className, 'field select w-1/2 flex flex-align-items-center py-0 pl-2'])}
                hasCaret
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                aria-label={colorName}
            >
                <span className="flex-item-fluid text-left flex flex-nowrap flex-align-items-center gap-2">
                    <Icon className="flex-item-noshrink" name="circle-filled" size={28} color={iconColor} />
                    {colorName && <span className="text-capitalize text-ellipsis">{colorName}</span>}
                </span>
            </DropdownButton>
            <Dropdown
                id={uid}
                isOpen={isOpen}
                size={{ maxWidth: DropdownSizeUnit.Viewport, maxHeight: DropdownSizeUnit.Viewport }}
                anchorRef={anchorRef}
                onClose={close}
                disableDefaultArrowNavigation
            >
                <ColorSelector selected={color} onChange={onChange} colors={options} className="p-4" />
            </Dropdown>
        </>
    );
};

export default ColorPicker;
