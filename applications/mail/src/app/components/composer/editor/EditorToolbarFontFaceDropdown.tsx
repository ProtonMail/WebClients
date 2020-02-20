import React, { MutableRefObject, useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuButton } from 'react-components';

import { SquireType, FONT_FACE } from '../../../helpers/squire/squireConfig';
import EditorToolbarDropdown from './EditorToolbarDropdown';
import { listenToCursor, getFontFaceAtCursor, getFontLabel } from '../../../helpers/squire/squireActions';

interface Props {
    squireRef: MutableRefObject<SquireType>;
    editorReady: boolean;
}

const EditorToolbarFontFaceDropdown = ({ squireRef, editorReady }: Props) => {
    const [value, setValue] = useState(FONT_FACE.Arial);

    useEffect(
        () =>
            listenToCursor(squireRef.current, () => {
                setValue(getFontFaceAtCursor(squireRef.current));
            }),
        [editorReady]
    );

    const handleClick = (font: FONT_FACE) => () => {
        setValue(font);
        squireRef.current.setFontFace(font.toString());
    };

    return (
        <EditorToolbarDropdown
            className="flex-item-fluid alignright"
            content={<span style={{ fontFamily: value.toString() }}>{getFontLabel(value)}</span>}
        >
            <DropdownMenu>
                {Object.values(FONT_FACE).map((font) => (
                    <DropdownMenuButton
                        key={font}
                        disabled={font === value}
                        className="alignleft"
                        onClick={handleClick(font)}
                    >
                        {getFontLabel(font)}
                    </DropdownMenuButton>
                ))}
            </DropdownMenu>
        </EditorToolbarDropdown>
    );
};

export default EditorToolbarFontFaceDropdown;
