import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import { TrendChart } from '@proton/charts/TrendChart';
import type { TrendChartProps } from '@proton/charts/TrendChart.types';

const series = [
    { label: 'Wed', value: 32 },
    { label: 'Wed', value: 76 },
    { label: 'Thu', value: 28 },
    { label: 'Thu', value: 54 },
    { label: 'Fri', value: 35 },
    { label: 'Fri', value: 88 },
    { label: 'Sat', value: 41 },
    { label: 'Sat', value: 92 },
    { label: 'Sun', value: 30 },
    { label: 'Sun', value: 63 },
    { label: 'Mon', value: 38 },
    { label: 'Mon', value: 81 },
    { label: 'Tue', value: 26 },
    { label: 'Tue', value: 47 },
];

const formatPercentage = (value: number) => `${value}%`;

const DEFAULT_THRESHOLD = 55;
const RANGES = { '3 days': 6, Week: series.length };

type Range = keyof typeof RANGES;

const ChartPair = ({ args, mode }: { args: TrendChartProps; mode?: TrendChartProps['mode'] }) => {
    const { threshold, fill, thresholdColor, ...shared } = args;

    return (
        <div className="flex flex-nowrap gap-4 h-full">
            <div className="flex-1 min-w-0">
                <TrendChart {...shared} mode={mode} />
            </div>
            <div className="flex-1 min-w-0">
                <TrendChart
                    {...shared}
                    threshold={threshold ?? DEFAULT_THRESHOLD}
                    thresholdColor={thresholdColor}
                    mode={mode}
                />
            </div>
        </div>
    );
};

const RangeFiltered = (args: TrendChartProps) => {
    const [range, setRange] = useState<Range>('Week');

    return (
        <div className="flex flex-column flex-nowrap gap-3 h-full">
            <div className="flex flex-nowrap gap-2 shrink-0">
                {(Object.keys(RANGES) as Range[]).map((option) => (
                    <Button
                        key={option}
                        size="small"
                        shape={option === range ? 'solid' : 'outline'}
                        color={option === range ? 'norm' : 'weak'}
                        onClick={() => setRange(option)}
                    >
                        {option}
                    </Button>
                ))}
            </div>
            <div className="flex-auto min-h-0">
                <ChartPair args={{ ...args, data: series.slice(-RANGES[range]) }} />
            </div>
        </div>
    );
};

const LoadingPair = (args: TrendChartProps) => {
    const [hasArrived, setHasArrived] = useState(false);

    return (
        <div className="flex flex-column flex-nowrap gap-3 h-full">
            <div className="shrink-0">
                <Button size="small" onClick={() => setHasArrived(!hasArrived)}>
                    {hasArrived ? 'Load again' : 'Data has arrived'}
                </Button>
            </div>
            <div className="flex-auto min-h-0">
                <ChartPair args={args} mode={hasArrived ? 'view' : 'load'} />
            </div>
        </div>
    );
};

const FRAME = { height: '18rem', maxWidth: '44rem' };

const meta: Meta<typeof TrendChart> = {
    title: 'Charts/TrendChart',
    args: {
        data: series,
        transformTooltipValue: formatPercentage,
        transformYAxisValue: formatPercentage,
    },
    argTypes: {
        threshold: { control: { type: 'range', min: 0, max: 100, step: 5 } },
    },
    component: TrendChart,
    decorators: [
        (Story) => (
            <div
                className="h-custom max-w-custom"
                style={{ '--h-custom': FRAME.height, '--max-w-custom': FRAME.maxWidth }}
            >
                <Story />
            </div>
        ),
    ],
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof TrendChart>;

export const Default: Story = {
    args: {
        threshold: DEFAULT_THRESHOLD,
    },
    parameters: {
        docs: {
            description: {
                story: 'The chart plain on the left, and on the right the same chart ruling a threshold.',
            },
        },
    },
    render: (args) => <ChartPair args={args} />,
};

export const TooltipWithoutLabel: Story = {
    args: {
        showTooltipLabel: false,
        threshold: DEFAULT_THRESHOLD,
    },
    parameters: {
        docs: {
            description: {
                story: '`showTooltipLabel={false}` drops the x axis label when hovering the chart. No Wed 76%',
            },
        },
    },
    render: (args) => <ChartPair args={args} />,
};

export const Filter: Story = {
    args: {
        threshold: DEFAULT_THRESHOLD,
    },
    parameters: {
        docs: {
            description: {
                story: 'Showcase of how chart.js animates when updating data to a chart instance.',
            },
        },
    },
    render: (args) => <RangeFiltered {...args} />,
};

export const Loading: Story = {
    args: {
        threshold: DEFAULT_THRESHOLD,
    },
    parameters: {
        docs: {
            description: {
                story: '`mode="load"` sends the chart instance a bunch of hardcoded data to indicate a loading.\n\nPress **Data has arrived** to hand both the real series.',
            },
        },
    },
    render: (args) => <LoadingPair {...args} />,
};
