import React, { MutableRefObject, useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuButton } from 'react-components';

import { SquireType, FONT_SIZES } from '../../../helpers/squire/squireConfig';
import EditorToolbarDropdown from './EditorToolbarDropdown';
import { listenToCursor, getFontSizeAtCursor } from '../../../helpers/squire/squireActions';

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
        <EditorToolbarDropdown size="narrow" content={value}>
            <DropdownMenu>
                {Object.values(FONT_SIZES).map((size) => (
                    <DropdownMenuButton
                        key={size}
                        disabled={size === value}
                        className="alignleft"
                        onClick={handleClick(size)}
                    >
                        {size}
                    </DropdownMenuButton>
                ))}
            </DropdownMenu>
        </EditorToolbarDropdown>
    );
};

export default EditorToolbarFontSizeDropdown;
