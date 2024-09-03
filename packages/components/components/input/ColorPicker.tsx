import { useState } from 'react';

import tinycolor from 'tinycolor2';
import { c } from 'ttag';

import generateUID from '@proton/atoms/generateUID';
import { ACCENT_COLORS_MAP, getColorName } from '@proton/shared/lib/colors';
import { omit } from '@proton/shared/lib/helpers/object';
import clsx from '@proton/utils/clsx';

import ColorSelector from '../color/ColorSelector';
import { Dropdown, DropdownButton, DropdownSizeUnit } from '../dropdown';
import type { DropdownButtonProps } from '../dropdown/DropdownButton';
import { Icon } from '../icon';
import { usePopperAnchor } from '../popper';

interface OwnProps {
    color?: string;
    onChange: (color: string) => void;
    displayColorName?: boolean;
    onClickColorPicker?: (toggle: () => void) => void;
}

type ButtonProps = DropdownButtonProps<'button'>;

export type Props =
    | ({ layout: 'inline' } & OwnProps)
    | ({ layout?: 'dropdown' } & OwnProps & Omit<ButtonProps, 'onChange' | 'as'>);

const getOptions = () => {
    return Object.values(ACCENT_COLORS_MAP).map(({ color, getName }) => ({ value: color, label: getName() }));
};

const ColorPicker = ({ color = '#5252CC', onChange, displayColorName = true, onClickColorPicker, ...rest }: Props) => {
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

    const handleToggle = () => {
        if (onClickColorPicker) {
            onClickColorPicker?.(toggle);
        } else {
            toggle();
        }
    };
    return (
        <>
            <DropdownButton
                {...restDropdownProps}
                as="button"
                type="button"
                className={clsx([className, displayColorName && 'w-1/2', 'field select flex items-center py-0 pl-2'])}
                hasCaret
                ref={anchorRef}
                isOpen={isOpen}
                onClick={handleToggle}
                aria-label={colorName}
            >
                <span className="flex-1 text-left flex flex-nowrap items-center gap-2">
                    <span className="sr-only">{c('info').t`Selected color:`}</span>
                    <Icon
                        className="shrink-0"
                        name="circle-filled"
                        size={7}
                        color={iconColor}
                        alt={displayColorName ? undefined : colorName}
                    />
                    {displayColorName && colorName && (
                        <span className="text-capitalize text-ellipsis">{colorName}</span>
                    )}
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
