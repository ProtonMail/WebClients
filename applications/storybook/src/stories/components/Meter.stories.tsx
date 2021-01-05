import React from 'react';
import { Meter } from 'react-components';

import mdx from './Meter.mdx';

export default {
    component: Meter,
    title: 'Components / Meter',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    return (
        <>
            <Meter value={20} />
            <Meter value={80} />
            <Meter value={100} />
        </>
    );
};
