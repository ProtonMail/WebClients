import { useState } from 'react';
import { c } from 'ttag';
import Icon from '../../icon/Icon';
import ColorSelector from '../../color/ColorSelector';
import { FONT_COLORS } from '../constants';
import ToolbarDropdown from './ToolbarDropdown';
import { Tabs } from '../../tabs';

interface Props {
    fontColor: string;
    bgColor: string;
    setFontColor: (nextColor: string) => void;
    setBgColor: (nextColor: string) => void;
}

const ToolbarColorsDropdown = ({ fontColor, bgColor, setFontColor, setBgColor }: Props) => {
    const [tabIndex, setTabIndex] = useState(0);

    const tabs = [
        {
            title: c('Info').t`Text color`,
            content: (
                <>
                    <ColorSelector selected={fontColor} onChange={setFontColor} colors={FONT_COLORS} />
                </>
            ),
        },
        {
            title: c('Info').t`Background color`,
            content: (
                <>
                    <ColorSelector selected={bgColor} onChange={setBgColor} colors={FONT_COLORS} />
                </>
            ),
        },
    ];

    return (
        <ToolbarDropdown
            noMaxSize
            content={<Icon name="color" alt={c('Action').t`Color`} />}
            className="flex-item-noshrink"
            title={c('Action').t`Color`}
        >
            <div className="p1">
                <Tabs tabs={tabs} value={tabIndex} onChange={setTabIndex} />
            </div>
        </ToolbarDropdown>
    );
};

export default ToolbarColorsDropdown;
