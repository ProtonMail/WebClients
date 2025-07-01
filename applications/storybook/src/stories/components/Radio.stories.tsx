import { useState } from 'react';

import { Radio, RadioGroup } from '@proton/components';

import mdx from './Radio.mdx';

export default {
    component: Radio,
    title: 'Components/Radio',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const weather = ['Snow', 'Sunshine', 'Rain'] as const;

export const Basic = () => {
    const [selectedColor, setSelectedColor] = useState<(typeof weather)[number] | undefined>(undefined);

    return (
        <div>
            <RadioGroup
                name="selected-weather"
                onChange={(v) => setSelectedColor(v)}
                value={selectedColor}
                options={weather.map((option) => ({ value: option, label: option }))}
            />
        </div>
    );
};
