import { MutableRefObject, useState, useEffect } from 'react';
import { c } from 'ttag';
import Icon from '../../icon/Icon';
import ColorSelector from '../../color/ColorSelector';
import { DEFAULT_FONT_COLOR, DEFAULT_BACKGROUND, FONT_COLORS } from '../squireConfig';
import { getColorsAtCursor, listenToCursor } from '../squireActions';
import SquireToolbarDropdown from './SquireToolbarDropdown';
import { SquireType } from '../interface';
import { Tabs } from '../../tabs';

interface Props {
    squireRef: MutableRefObject<SquireType>;
    editorReady: boolean;
}

const SquireToolbarFontColorsDropdown = ({ squireRef, editorReady }: Props) => {
    const [fontColor, setFontColor] = useState(DEFAULT_FONT_COLOR());
    const [bgColor, setBgColor] = useState(DEFAULT_BACKGROUND());
    const [tabIndex, setTabIndex] = useState(0);

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

    const tabs = [
        {
            title: c('Info').t`Text color`,
            content: (
                <>
                    <ColorSelector selected={fontColor} onChange={handleFontChange} colors={FONT_COLORS} />
                </>
            ),
        },
        {
            title: c('Info').t`Background color`,
            content: (
                <>
                    <ColorSelector selected={bgColor} onChange={handleBgChange} colors={FONT_COLORS} />
                </>
            ),
        },
    ];

    return (
        <SquireToolbarDropdown
            noMaxSize
            autoClose={false}
            content={<Icon name="color" alt={c('Action').t`Color`} />}
            className="flex-item-noshrink"
            title={c('Action').t`Color`}
        >
            <div className="p1">
                <Tabs tabs={tabs} value={tabIndex} onChange={setTabIndex} />
            </div>
        </SquireToolbarDropdown>
    );
};

export default SquireToolbarFontColorsDropdown;
