import { useEffect, useState } from 'react';

import tinycolor from 'tinycolor2';

import { Checkbox } from '@proton/components';

import Pill from './Pill';
import mdx from './Pill.mdx';

export default {
    component: Pill,
    title: 'components/Pill',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => <Pill>Text</Pill>;

export const OnlyColor = () => <Pill color="#aa0867">Text</Pill>;

export const OnlyBackground = () => <Pill backgroundColor="#d2ffcc">Text</Pill>;

export const Both = () => (
    <Pill color="#b90404" backgroundColor="#fff2b3">
        Text
    </Pill>
);

export const Sandbox = () => {
    const [tmpColor, setTempColor] = useState('#9b2cba');
    const [tmpBackground, setTempBackground] = useState('#d2ffcc');
    const [hasColor, setHasColor] = useState(true);
    const [hasBackground, setHasBackground] = useState(false);

    const [isReadable, setIsReadable] = useState(true);

    useEffect(() => {
        const storyElement = document.querySelector('#pill-color-contrast-checker');

        if (!storyElement) {
            return;
        }

        const computedStyles = window.getComputedStyle(storyElement);

        setIsReadable(tinycolor.isReadable(tinycolor(computedStyles.color), tinycolor(computedStyles.backgroundColor)));
    }, [tmpColor, tmpBackground, hasColor, hasBackground]);

    return (
        <div className="border rounded p-6">
            <Pill
                id="pill-color-contrast-checker"
                color={hasColor ? tmpColor : undefined}
                backgroundColor={hasBackground ? tmpBackground : undefined}
            >
                Text
            </Pill>

            {isReadable ? (
                <p className="text-sm color-weak">Text contrast good</p>
            ) : (
                <p className="text-sm color-danger">Caution, text contrast not optimal</p>
            )}

            <div className="flex gap-4 items-center mt-4">
                <b>Color</b>
                <Checkbox onChange={(e) => setHasColor(e.target.checked)} checked={hasColor} />
                <input
                    type="color"
                    onChange={(e) => setTempColor(e.target.value)}
                    style={{ height: '30px' }}
                    value={tmpColor}
                />
                <input
                    type="text"
                    onChange={(e) => setTempColor(e.target.value)}
                    style={{ height: '30px' }}
                    value={tmpColor}
                />
            </div>
            <div className="flex gap-4 items-center mt-4">
                <b>Background Color</b>
                <Checkbox onChange={(e) => setHasBackground(e.target.checked)} checked={hasBackground} />
                <input
                    type="color"
                    onChange={(e) => setTempBackground(e.target.value)}
                    style={{ height: '30px' }}
                    value={tmpBackground}
                />
                <input
                    type="text"
                    onChange={(e) => setTempBackground(e.target.value)}
                    style={{ height: '30px' }}
                    value={tmpBackground}
                />
            </div>
        </div>
    );
};
