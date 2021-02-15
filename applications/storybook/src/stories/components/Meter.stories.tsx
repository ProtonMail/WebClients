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

export const Primary = ({ ...args }) => <Meter {...args} />;

Primary.args = {
    min: 0,
    low: 50,
    high: 80,
    max: 100,
    optimum: 0,
    value: 50,
    variant: 'default',
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

export const Variants = () => {
    return (
        <>
            <Meter value={40} />
            <Meter variant="thin" value={40} />
        </>
    );
};
