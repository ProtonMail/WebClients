import { DonutChart } from '@proton/components';
import { ChangeEvent, useState } from 'react';

import { getTitle } from '../../helpers/title';
import mdx from './DonutChart.mdx';

export default {
    component: DonutChart,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => {
    return (
        <div style={{ width: 200, height: 200 }}>
            <DonutChart
                chunks={[
                    [20, 'var(--signal-danger)'],
                    [10, 'var(--signal-warning)'],
                    [15, 'var(--signal-success)'],
                ]}
            />
        </div>
    );
};

export const WithSlider = () => {
    const [success, setSuccess] = useState(15);

    return (
        <div>
            <input
                className="mb2"
                style={{ appearance: 'auto' }}
                type="range"
                value={success}
                min={0}
                max={100 - 30}
                onInput={(e: ChangeEvent<HTMLInputElement>) => setSuccess(Number(e.target.value))}
            />

            <div style={{ width: 200, height: 200 }}>
                <DonutChart
                    chunks={[
                        [20, 'var(--signal-danger)'],
                        [10, 'var(--signal-warning)'],
                        [success, 'var(--signal-success)'],
                    ]}
                />
            </div>
        </div>
    );
};
