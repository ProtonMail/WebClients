import React, { MutableRefObject, useState, useEffect } from 'react';
import { c } from 'ttag';

import DropdownMenu from '../../dropdown/DropdownMenu';
import DropdownMenuButton from '../../dropdown/DropdownMenuButton';

import { SquireType, FONT_FACE } from '../squireConfig';
import SquireToolbarDropdown from './SquireToolbarDropdown';
import { listenToCursor, getFontFaceAtCursor, getFontLabel } from '../squireActions';

interface Props {
    squireRef: MutableRefObject<SquireType>;
    editorReady: boolean;
}

const SquireToolbarFontFaceDropdown = ({ squireRef, editorReady }: Props) => {
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
        <SquireToolbarDropdown
            className="composer-toolbar-fontDropDown alignright flex no-scroll"
            title={c('Action').t`Font`}
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
                        isSelected={font === value}
                        className="alignleft"
                        onClick={handleClick(font)}
                        style={{ fontFamily: font.toString() }}
                    >
                        {getFontLabel(font)}
                    </DropdownMenuButton>
                ))}
            </DropdownMenu>
        </SquireToolbarDropdown>
    );
};

export default SquireToolbarFontFaceDropdown;
