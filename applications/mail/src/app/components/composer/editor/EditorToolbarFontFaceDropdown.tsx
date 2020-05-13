import React, { MutableRefObject, useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuButton } from 'react-components';

import { SquireType, FONT_FACE } from '../../../helpers/squire/squireConfig';
import EditorToolbarDropdown from './EditorToolbarDropdown';
import { listenToCursor, getFontFaceAtCursor, getFontLabel } from '../../../helpers/squire/squireActions';

interface Props {
    squireRef: MutableRefObject<SquireType>;
    editorReady: boolean;
    title?: string;
}

const EditorToolbarFontFaceDropdown = ({ squireRef, editorReady, title }: Props) => {
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
            className="composer-toolbar-fontDropDown alignright flex no-scroll"
            title={title}
            content={
                <span className="ellipsis mw100" style={{ fontFamily: value.toString() }}>
                    {getFontLabel(value)}
                </span>
            }
        >
            <DropdownMenu>
                {Object.values(FONT_FACE).map((font) => (
                    <DropdownMenuButton
                        key={font}
                        disabled={font === value}
                        className="alignleft"
                        onClick={handleClick(font)}
                        style={{ fontFamily: font.toString() }}
                    >
                        {getFontLabel(font)}
                    </DropdownMenuButton>
                ))}
            </DropdownMenu>
        </EditorToolbarDropdown>
    );
};

export default EditorToolbarFontFaceDropdown;
