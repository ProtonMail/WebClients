import React, { MutableRefObject, useState, useEffect } from 'react';
import { c } from 'ttag';

import DropdownMenu from '../../dropdown/DropdownMenu';
import DropdownMenuButton from '../../dropdown/DropdownMenuButton';

import { SquireType, FONT_SIZES } from '../squireConfig';
import SquireToolbarDropdown from './SquireToolbarDropdown';
import { listenToCursor, getFontSizeAtCursor } from '../squireActions';

interface Props {
    squireRef: MutableRefObject<SquireType>;
    editorReady: boolean;
}

const EditorToolbarFontSizeDropdown = ({ squireRef, editorReady }: Props) => {
    const [value, setValue] = useState(14);

    useEffect(
        () =>
            listenToCursor(squireRef.current, () => {
                setValue(getFontSizeAtCursor(squireRef.current));
            }),
        [editorReady]
    );

    const handleClick = (size: number) => () => {
        setValue(size);
        squireRef.current.setFontSize(`${size}px`);
    };

    return (
        <SquireToolbarDropdown content={value} className="flex-item-noshrink" title={c('Action').t`Size`}>
            <DropdownMenu>
                {Object.values(FONT_SIZES).map((size) => (
                    <DropdownMenuButton
                        key={size}
                        isSelected={size === value}
                        className="text-left"
                        onClick={handleClick(size)}
                    >
                        {size}
                    </DropdownMenuButton>
                ))}
            </DropdownMenu>
        </SquireToolbarDropdown>
    );
};

export default EditorToolbarFontSizeDropdown;
