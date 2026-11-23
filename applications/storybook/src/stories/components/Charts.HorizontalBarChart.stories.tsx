import { useState } from 'react';
import type { ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import { Slider } from '@proton/atoms/Slider/Slider';
import { HorizontalBarChart } from '@proton/charts/HorizontalBarChart';
import type { BarDataPoint, HorizontalBarChartProps } from '@proton/charts/HorizontalBarChart.types';

const gateways: BarDataPoint[] = [
    { label: 'DEV-VPN', value: 782 },
    { label: 'INFRA-VPN', value: 279 },
    { label: 'MRKT-VPN', value: 291 },
    { label: 'STAGING-VPN', value: 72 },
];

const quiet: BarDataPoint[] = [
    { label: 'DEV-VPN', value: 14 },
    { label: 'INFRA-VPN', value: 9 },
    { label: 'MRKT-VPN', value: 11 },
    { label: 'STAGING-VPN', value: 3 },
];

const many: BarDataPoint[] = [
    { label: 'GATEWAY-01', value: 100 },
    { label: 'GATEWAY-02', value: 94 },
    { label: 'GATEWAY-03', value: 87 },
    { label: 'GATEWAY-04', value: 81 },
    { label: 'GATEWAY-05', value: 74 },
    { label: 'GATEWAY-06', value: 68 },
    { label: 'GATEWAY-07', value: 61 },
    { label: 'GATEWAY-08', value: 55 },
    { label: 'GATEWAY-09', value: 48 },
    { label: 'GATEWAY-10', value: 42 },
    { label: 'GATEWAY-11', value: 35 },
    { label: 'GATEWAY-12', value: 29 },
    { label: 'GATEWAY-13', value: 22 },
    { label: 'GATEWAY-14', value: 16 },
];

const formatPercentage = (value: number) => `${value}%`;

const formatConnections = (value: number) => `${value} connections`;

const Captioned = ({ caption, children }: { caption: string; children: ReactNode }) => (
    <div className="flex flex-column flex-nowrap gap-2 flex-1 min-w-0">
        <span className="text-sm color-weak shrink-0">{caption}</span>
        <div className="flex-auto min-h-0">{children}</div>
    </div>
);

const RangePair = (args: HorizontalBarChartProps) => (
    <div className="flex flex-nowrap gap-6 h-full">
        <Captioned caption="No valueRange — the bars span the smallest and largest readings">
            <HorizontalBarChart {...args} valueRange={undefined} />
        </Captioned>
        <Captioned caption="valueRange 0–100 — the rows read against the scale they mean">
            <HorizontalBarChart {...args} valueRange={{ min: 0, max: 100 }} />
        </Captioned>
    </div>
);

const Knob = ({ label, children }: { label: string; children: ReactNode }) => (
    <>
        <span className="text-sm color-weak">{label}</span>
        <div className="flex flex-nowrap items-center gap-2">{children}</div>
    </>
);

const Scrubber = ({
    value,
    min,
    max,
    onChange,
}: {
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
}) => (
    <div className="flex flex-nowrap items-center gap-3 w-custom" style={{ '--w-custom': '12rem' }}>
        <Slider min={min} max={max} step={1} color="norm" value={value} onInput={onChange} />
        <span className="text-sm color-norm tabular-nums w-custom text-right" style={{ '--w-custom': '1.5rem' }}>
            {value}
        </span>
    </div>
);

const PANEL = {
    display: 'grid',
    gridTemplateColumns: 'max-content max-content max-content max-content',
    justifyContent: 'start',
    alignItems: 'center',
    columnGap: '1.5rem',
    rowGap: '1.25rem',
} as const;

const Choice = <T,>({
    options,
    value,
    onChange,
}: {
    options: { label: string; value: T }[];
    value: T;
    onChange: (value: T) => void;
}) => (
    <div className="flex flex-nowrap gap-1">
        {options.map((option) => (
            <Button
                key={option.label}
                size="small"
                shape={option.value === value ? 'solid' : 'outline'}
                color={option.value === value ? 'norm' : 'weak'}
                onClick={() => onChange(option.value)}
            >
                {option.label}
            </Button>
        ))}
    </div>
);

const POOL: BarDataPoint[] = [
    { label: 'DEV-VPN', value: 782 },
    { label: 'INFRA-VPN', value: 279 },
    { label: 'MRKT-VPN', value: 291 },
    { label: 'STAGING-VPN', value: 72 },
    { label: 'GATEWAY-05', value: 611 },
    { label: 'GATEWAY-06', value: 486 },
    { label: 'GATEWAY-07', value: 358 },
    { label: 'GATEWAY-08', value: 244 },
    { label: 'GATEWAY-09', value: 198 },
    { label: 'GATEWAY-10', value: 151 },
    { label: 'GATEWAY-11', value: 120 },
    { label: 'GATEWAY-12', value: 63 },
];

const PlaygroundChart = (args: HorizontalBarChartProps) => {
    const [rows, setRows] = useState(4);
    const [gridLines, setGridLines] = useState(5);
    const [fixedRange, setFixedRange] = useState(false);
    const [fill, setFill] = useState<NonNullable<HorizontalBarChartProps['fill']>>('primary');
    const [showTooltipLabel, setShowTooltipLabel] = useState(true);
    const [mode, setMode] = useState<NonNullable<HorizontalBarChartProps['mode']>>('view');

    const data = POOL.slice(0, rows);
    const readings = data.map(({ value }) => value);
    const smallest = readings.length ? Math.min(...readings) : 0;
    const largest = readings.length ? Math.max(...readings) : 100;

    return (
        <div className="flex flex-column flex-nowrap gap-4 h-full">
            <div className="shrink-0" style={PANEL}>
                <Knob label="Rows">
                    <Scrubber min={1} max={POOL.length} value={rows} onChange={setRows} />
                </Knob>
                <Knob label="Colour">
                    <Choice
                        options={(['primary', 'success', 'warning', 'danger'] as const).map((value) => ({
                            label: value,
                            value,
                        }))}
                        value={fill}
                        onChange={setFill}
                    />
                </Knob>
                <Knob label="Gridlines">
                    <Scrubber min={0} max={11} value={gridLines} onChange={setGridLines} />
                </Knob>
                <Knob label="Tooltip">
                    <Choice
                        options={[
                            { label: 'Names the row', value: true },
                            { label: 'Reading only', value: false },
                        ]}
                        value={showTooltipLabel}
                        onChange={setShowTooltipLabel}
                    />
                </Knob>
                <Knob label="Scale">
                    <Choice
                        options={[
                            { label: `Fit to data (${smallest}–${largest})`, value: false },
                            { label: '0–1000', value: true },
                        ]}
                        value={fixedRange}
                        onChange={setFixedRange}
                    />
                </Knob>
                <Knob label="State">
                    <Choice
                        options={[
                            { label: 'View', value: 'view' as const },
                            { label: 'Loading', value: 'load' as const },
                        ]}
                        value={mode}
                        onChange={setMode}
                    />
                </Knob>
            </div>
            <div className="flex-auto min-h-0">
                <HorizontalBarChart
                    {...args}
                    mode={mode}
                    data={data}
                    gridLines={gridLines}
                    valueRange={fixedRange ? { min: 0, max: 1000 } : undefined}
                    fill={fill}
                    showTooltipLabel={showTooltipLabel}
                />
            </div>
        </div>
    );
};

const LoadingToggle = (args: HorizontalBarChartProps) => {
    const [hasArrived, setHasArrived] = useState(false);

    return (
        <div className="flex flex-column flex-nowrap gap-3 h-full">
            <div className="shrink-0">
                <Button size="small" onClick={() => setHasArrived(!hasArrived)}>
                    {hasArrived ? 'Load again' : 'Data has arrived'}
                </Button>
            </div>
            <div className="flex-auto min-h-0">
                <HorizontalBarChart {...args} mode={hasArrived ? 'view' : 'load'} />
            </div>
        </div>
    );
};

const FRAME = { height: '18rem', maxWidth: '44rem' };

type Frame = typeof FRAME;

const meta: Meta<typeof HorizontalBarChart> = {
    title: 'Charts/HorizontalBarChart',
    args: {
        data: gateways,
    },
    argTypes: {
        gridLines: { control: { type: 'range', min: 0, max: 11, step: 1 } },
        valueRange: { control: 'object' },
        fill: { control: 'select', options: ['primary', 'danger', 'warning', 'success', 'info'] },
    },
    component: HorizontalBarChart,
    decorators: [
        (Story, { parameters }) => {
            const { height, maxWidth }: Frame = { ...FRAME, ...parameters.frame };

            return (
                <div className="h-custom max-w-custom" style={{ '--h-custom': height, '--max-w-custom': maxWidth }}>
                    <Story />
                </div>
            );
        },
    ],
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof HorizontalBarChart>;

export const Playground: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Every option this chart takes, on one chart. Turn the gridlines down to two and the plot is ruled at its ends alone; pin the scale and watch a busy-looking set of rows become a quiet one; drag the rows down to two and the bars stop thickening, up to twelve and they share the height the container gives.',
            },
        },
        frame: { height: '28rem', maxWidth: '52rem' },
    },
    render: (args) => <PlaygroundChart {...args} />,
};

export const Default: Story = {
    parameters: {
        docs: {
            description: {
                story: 'One bar per row, measured between the smallest and largest readings in the set, since no `valueRange` says otherwise. The reading is written past the end of every bar, and the plot keeps room for the widest of them so the longest bar is not the one whose number gets clipped.',
            },
        },
    },
};

export const WhatTheRangeDoes: Story = {
    args: {
        data: quiet,
        transformValueLabel: formatPercentage,
        transformTooltipValue: formatPercentage,
    },
    parameters: {
        docs: {
            description: {
                story: 'The same four gateways twice. On the left, with no `valueRange`, the chart spans the readings themselves: the largest fills the plot and the smallest sits at the axis with no bar at all, so a quiet set of gateways looks busy and the quietest looks like nothing. On the right the same rows are measured against 0–100, which is what they actually mean.',
            },
        },
    },
    render: (args) => <RangePair {...args} />,
};

export const RowThatSaysSomethingElse: Story = {
    args: {
        data: [
            { label: 'DEV-VPN', value: 94, fill: 'danger' },
            { label: 'INFRA-VPN', value: 48 },
            { label: 'MRKT-VPN', value: 53 },
            { label: 'STAGING-VPN', value: 11 },
        ],
        valueRange: { min: 0, max: 100 },
        transformValueLabel: formatPercentage,
        fill: 'success',
    },
    parameters: {
        docs: {
            description: {
                story: 'A `fill` on a row overrides the series, for the one gateway that is over its limit.',
            },
        },
    },
};

export const ShortenedNames: Story = {
    args: {
        transformCategoryValue: (label: string) => label.replace('-VPN', ''),
        transformTooltipValue: formatConnections,
    },
    parameters: {
        docs: {
            description: {
                story: 'The names take the room they need and push the plot across, so a long one is shortened by the caller rather than truncated here. The tooltip still names the row in full, which is why it is worth keeping on.',
            },
        },
    },
};

export const Gridlines: Story = {
    args: {
        gridLines: 3,
        valueRange: { min: 0, max: 800 },
    },
    parameters: {
        docs: {
            description: {
                story: 'Lines down the plot at even fractions of the range, both ends included. Five by default, so quarters; two draws the ends alone and anything below that draws none.',
            },
        },
    },
};

export const TooltipWithoutLabel: Story = {
    args: {
        showTooltipLabel: false,
    },
    parameters: {
        docs: {
            description: {
                story: '`showTooltipLabel={false}` drops the row name from the tooltip, for a chart whose rows already speak for themselves.',
            },
        },
    },
};

export const ManyRows: Story = {
    args: {
        data: many,
        valueRange: { min: 0, max: 100 },
        transformValueLabel: formatPercentage,
    },
    parameters: {
        docs: {
            description: {
                story: 'Height comes from the container, so rows share the room it gives: fourteen of them in the same frame as four. What to do about a list longer than fits — scrolling, paging, a top ten — belongs to the caller, who is the only one who knows.',
            },
        },
    },
};

export const FewRows: Story = {
    args: {
        data: [
            { label: 'DEV-VPN', value: 782 },
            { label: 'INFRA-VPN', value: 279 },
        ],
    },
    parameters: {
        docs: {
            description: {
                story: 'A bar stops thickening past its cap, so a low row count leaves whitespace rather than drawing slabs.',
            },
        },
    },
};

export const ReadingsBelowZero: Story = {
    args: {
        data: [
            { label: 'DEV-VPN', value: 782 },
            { label: 'INFRA-VPN', value: 279 },
            { label: 'MRKT-VPN', value: -140 },
            { label: 'STAGING-VPN', value: -512 },
        ],
        transformTooltipValue: formatConnections,
    },
    parameters: {
        docs: {
            description: {
                story: 'A reading below zero bases its bar at the axis and runs left of it. The chart widens the gap between the names and the plot to fit the readings those bars carry, so a number is never written over the name of a row.',
            },
        },
    },
};

export const Empty: Story = {
    args: {
        data: [],
    },
    parameters: {
        docs: {
            description: {
                story: 'An empty series rules the plot and draws nothing in it. The chart writes no copy of its own, so the "no data" line above it belongs to the page.',
            },
        },
    },
};

export const Loading: Story = {
    args: {
        transformValueLabel: formatConnections,
    },
    parameters: {
        docs: {
            description: {
                story: '`mode="load"` stands in for the chart while it waits: grey rows under a shimmer, blocks where the names will be, and nothing written that it does not yet know.',
            },
        },
    },
    render: (args) => <LoadingToggle {...args} />,
};
