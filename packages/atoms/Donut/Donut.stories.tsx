import { ChangeEvent, useState } from 'react';



import { ThemeColor, getVariableFromThemeColor } from '@proton/colors';

import Donut from './Donut';
import mdx from './Donut.mdx';

export default {
    component: Donut,
    title: 'components/Donut',
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
                segments={[
                    [20, ThemeColor.Danger],
                    [10, ThemeColor.Warning],
                    [15, ThemeColor.Success],
                    [10, ThemeColor.Norm],
                    [5, ThemeColor.Weak],
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
                className="mb-8"
                style={{ appearance: 'auto' }}
                type="range"
                value={success}
                min={0}
                max={200}
                onInput={(e: ChangeEvent<HTMLInputElement>) => setSuccess(Number(e.target.value))}
            />

            <div style={{ width: 200, height: 200 }}>
                <Donut
                    segments={[
                        [40, ThemeColor.Danger],
                        [20, ThemeColor.Warning],
                        [success, ThemeColor.Success],
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

    const labelledSegments = [
        { label: 'Already used', value: [used, ThemeColor.Danger] },
        { label: 'Already allocated', value: [alreadyAllocated, ThemeColor.Warning] },
        { label: 'Allocated', value: [allocated, ThemeColor.Success] },
    ] as const;

    return (
        <div className="flex items-center">
            <div className="mr-8" style={{ width: 160, height: 160 }}>
                <Donut segments={labelledSegments.map(({ value }) => value as [number, string])} />
            </div>
            <div>
                {labelledSegments.map(({ label, value: [share, color] }) => (
                    <div className="mb-4 flex items-center">
                        <span
                            className="inline-block mr-4"
                            style={{
                                width: 36,
                                height: 24,
                                borderRadius: 8,
                                background: `var(${getVariableFromThemeColor(color)})`,
                            }}
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