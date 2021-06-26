import React, { useState } from 'react';
import { Scale } from '@proton/components';

import mdx from './Scale.mdx';

export default {
    component: Scale,
    title: 'Components / Scale',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    const [value, setValue] = useState<number>();

    const handleChange = (v: number) => {
        setValue(v);
    };

    return (
        <Scale
            from={0}
            to={10}
            fromLabel="0 - Not at all likely"
            toLabel="10 - Extremely likely"
            value={value}
            onChange={handleChange}
        />
    );
};
