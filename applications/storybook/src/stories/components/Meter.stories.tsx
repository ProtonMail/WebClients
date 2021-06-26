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
};

export const Basic = () => {
    return (
        <>
            <Meter className="mt1 mb1" value={20} />
            <Meter className="mt1 mb1" value={75} />
            <Meter className="mt1 mb1" value={100} />
        </>
    );
};

export const Variants = () => {
    return (
        <>
            <Meter className="mt1 mb1" value={40} />
            <Meter className="mt1 mb1" thin value={40} />
        </>
    );
};
