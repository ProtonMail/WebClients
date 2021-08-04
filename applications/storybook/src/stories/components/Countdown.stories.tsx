import { Countdown } from '@proton/components';

import mdx from './Countdown.mdx';

export default {
    component: Countdown,
    title: 'Components / Countdown',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const start = new Date();
const year = start.getFullYear();
const month = start.getMonth();
const day = start.getDate();
const end = new Date(year + 1, month, day);

export const Basic = () => {
    return <Countdown start={start} end={end} />;
};

export const Separator = () => {
    return <Countdown start={start} end={end} separator="⭐" />;
};
