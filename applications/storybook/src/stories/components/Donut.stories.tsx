import { Donut } from '@proton/components';
import { ChangeEvent, useState } from 'react';

import { getTitle } from '../../helpers/title';
import mdx from './Donut.mdx';

export default {
    component: Donut,
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
            <Donut
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
    const [success, setSuccess] = useState(20);

    return (
        <div>
            <input
                className="mb2"
                style={{ appearance: 'auto' }}
                type="range"
                value={success}
                min={0}
                max={200}
                onInput={(e: ChangeEvent<HTMLInputElement>) => setSuccess(Number(e.target.value))}
            />

            <div style={{ width: 200, height: 200 }}>
                <Donut
                    chunks={[
                        [40, 'var(--signal-danger)'],
                        [20, 'var(--signal-warning)'],
                        [success, 'var(--signal-success)'],
                    ]}
                />
            </div>
        </div>
    );
};

export const Accessibility = () => {
    const used = 40;
    const alreadyAllocated = 20;
    const allocated = 30;

    const labelledChunks = [
        { label: 'Already used', value: [used, 'var(--signal-danger)'] },
        { label: 'Already allocated', value: [alreadyAllocated, 'var(--signal-warning)'] },
        { label: 'Allocated', value: [allocated, 'var(--signal-success)'] },
    ];

    return (
        <div className="flex flex-align-items-center">
            <div className="mr2" style={{ width: 160, height: 160 }}>
                <Donut chunks={labelledChunks.map(({ value }) => value as [number, string])} />
            </div>
            <div>
                {labelledChunks.map(({ label, value: [share, color] }) => (
                    <div className="mb1 flex flex-align-items-center">
                        <span
                            className="inline-block mr1"
                            style={{ width: 36, height: 24, borderRadius: 8, background: color }}
                        />
                        <strong>
                            <span className="sr-only">{share} GB</span>
                            {label}
                        </strong>
                    </div>
                ))}
            </div>
        </div>
    );
};
