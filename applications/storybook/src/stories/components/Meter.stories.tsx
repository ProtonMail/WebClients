import { Meter } from '@proton/components';

import mdx from './Meter.mdx';

export default {
    component: Meter,
    title: 'Components/Meter',
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
            <Meter className="my-4" value={20} />
            <Meter className="my-4" value={75} />
            <Meter className="my-4" value={100} />
        </>
    );
};

export const Variants = () => {
    return (
        <>
            <Meter className="my-4" value={40} />
            <Meter className="my-4" thin value={40} />
        </>
    );
};
