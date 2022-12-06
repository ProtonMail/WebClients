import { useState } from 'react';

import { c } from 'ttag';

import { DropdownSizeUnit } from '@proton/components/components';

import ColorSelector from '../../color/ColorSelector';
import Icon from '../../icon/Icon';
import { Tabs } from '../../tabs';
import { FONT_COLORNAMES } from '../constants';
import ToolbarDropdown from './ToolbarDropdown';

interface Props {
    fontColor: string;
    bgColor: string;
    setFontColor: (nextColor: string) => void;
    setBgColor: (nextColor: string) => void;
}

const ToolbarColorsDropdown = ({ fontColor, bgColor, setFontColor, setBgColor }: Props) => {
    const [tabIndex, setTabIndex] = useState(0);
    const colors = Object.entries(FONT_COLORNAMES).map(([value, getLabel]) => ({ value, label: getLabel() }));

    const tabs = [
        {
            title: c('Info').t`Text color`,
            content: <ColorSelector selected={fontColor} onChange={setFontColor} colors={colors} />,
        },
        {
            title: c('Info').t`Background color`,
            content: <ColorSelector selected={bgColor} onChange={setBgColor} colors={colors} />,
        },
    ];

    return (
        <ToolbarDropdown
            dropdownSize={{ maxWidth: DropdownSizeUnit.Viewport, maxHeight: DropdownSizeUnit.Viewport }}
            content={<Icon name="circle-half-filled" alt={c('Action').t`Color`} />}
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
