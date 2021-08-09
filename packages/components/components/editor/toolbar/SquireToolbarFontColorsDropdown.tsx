import { MutableRefObject, useState, useEffect } from 'react';
import { c } from 'ttag';

import Icon from '../../icon/Icon';
import ColorSelector from '../../color/ColorSelector';

import { SquireType, DEFAULT_FONT_COLOR, DEFAULT_BACKGROUND, FONT_COLORS } from '../squireConfig';
import { getColorsAtCursor, listenToCursor } from '../squireActions';
import SquireToolbarDropdown from './SquireToolbarDropdown';

interface Props {
    squireRef: MutableRefObject<SquireType>;
    editorReady: boolean;
}

const SquireToolbarFontColorsDropdown = ({ squireRef, editorReady }: Props) => {
    const [fontColor, setFontColor] = useState(DEFAULT_FONT_COLOR());
    const [bgColor, setBgColor] = useState(DEFAULT_BACKGROUND());

    useEffect(
        () =>
            listenToCursor(squireRef.current, () => {
                const { font, bg } = getColorsAtCursor(squireRef.current);
                setFontColor(font);
                setBgColor(bg);
            }),
        [editorReady]
    );

    const handleFontChange = (color: string) => {
        setFontColor(color);
        squireRef.current.setTextColour(color);
    };

    const handleBgChange = (color: string) => {
        setBgColor(color);
        squireRef.current.setHighlightColour(color);
    };

    return (
        <SquireToolbarDropdown
            noMaxSize
            content={<Icon name="font" alt={c('Action').t`Color`} />}
            className="flex-item-noshrink"
            title={c('Action').t`Color`}
        >
            <div className="flex flex-row flex-nowrap">
                <div className="flex flex-column m0-5">
                    <p className="m0 mb0-5">{c('Info').t`Text color`}</p>
                    <ColorSelector selected={fontColor} onChange={handleFontChange} colors={FONT_COLORS} />
                </div>
                <div className="flex flex-column m0-5">
                    <p className="m0 mb0-5">{c('Info').t`Background color`}</p>
                    <ColorSelector selected={bgColor} onChange={handleBgChange} colors={FONT_COLORS} />
                </div>
            </div>
        </SquireToolbarDropdown>
    );
};

export default SquireToolbarFontColorsDropdown;
