import { useState } from 'react';

import { Radio, RadioGroup } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Radio.mdx';

export default {
    component: Radio,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const weather = ['Snow', 'Sunshine', 'Rain'];

export const Basic = () => {
    const [selectedColor, setSelectedColor] = useState();

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
