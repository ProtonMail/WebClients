import { useState } from 'react';

import { Slider } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Slider.mdx';

export default {
    component: Slider,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const [value, setValue] = useState(25);

    return (
        <div className="p2">
            <Slider value={value} onChange={setValue} />
        </div>
    );
};

export const Step = () => {
    const [value, setValue] = useState(20);

    return (
        <div className="p2">
            <Slider step={5} value={value} onChange={setValue} />
        </div>
    );
};

export const MinMax = () => {
    const [value, setValue] = useState(2000);

    return (
        <div className="p2">
            <Slider min={1000} max={10000} value={value} onChange={setValue} />
        </div>
    );
};
