import { ElementType, useState } from 'react';

import tinycolor from 'tinycolor2';

import { ACCENT_COLORNAMES } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { classnames, generateUID } from '../../helpers';
import ColorSelector from '../color/ColorSelector';
import { Dropdown, DropdownButton, DropdownSizeUnit } from '../dropdown';
import { DropdownButtonProps } from '../dropdown/DropdownButton';
import { Icon } from '../icon';
import { usePopperAnchor } from '../popper';

interface OwnProps {
    color?: string;
    onChange: (color: string) => void;
    layout?: 'inline' | 'dropdown';
}

export type Props<T extends ElementType> = OwnProps & DropdownButtonProps<T>;

const ColorPicker = <T extends ElementType>({
    color = 'blue',
    onChange = noop,
    layout = 'dropdown',
    className,
    ...rest
}: Props<T>) => {
    const colorModel = tinycolor(color) as any;
    const iconColor = colorModel.isValid() ? colorModel.toHexString() : '';

    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const colors = Object.values(ACCENT_COLORNAMES).map(({ color, getName }) => ({ value: color, label: getName() }));

    const colorName =
        Object.values(ACCENT_COLORNAMES)
            .filter((item) => item.color.includes(color.toUpperCase()))[0]
            .getName() || undefined;

    return (
        <>
            {layout === 'inline' && <ColorSelector selected={color} onChange={onChange} colors={colors} inline />}
            {layout === 'dropdown' && (
                <>
                    <DropdownButton
                        as="button"
                        type="button"
                        className={classnames([
                            className,
                            !rest.as && 'field select w50 flex flex-align-items-center py0 pl0-5',
                        ])}
                        hasCaret
                        {...rest}
                        ref={anchorRef}
                        isOpen={isOpen}
                        onClick={toggle}
                    >
                        <span className="flex-item-fluid text-left flex flex-nowrap flex-align-items-center flex-gap-0-5">
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
                        <ColorSelector selected={color} onChange={onChange} colors={colors} className="p1" />
                    </Dropdown>
                </>
            )}
        </>
    );
};

export default ColorPicker;
