import { useState } from 'react';
import type { PropsWithChildren } from 'react';

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
    /**
     * Named one by one rather than taken as the rest of `args`: everything to do with the rule
     * belongs to the right-hand chart alone, and the left-hand one has no threshold, so the props
     * that only mean something alongside one would not typecheck there.
     */
    const shared = {
        mode,
        data: args.data,
        valueRange: args.valueRange,
        transformYAxisValue: args.transformYAxisValue,
        transformXAxisValue: args.transformXAxisValue,
        transformTooltipValue: args.transformTooltipValue,
        showTooltipLabel: args.showTooltipLabel,
        borderWidth: args.borderWidth,
        tension: args.tension,
        ariaLabel: args.ariaLabel,
        className: args.className,
    };

    return (
        <div className="flex flex-nowrap gap-4 h-full">
            <div className="flex-1 min-w-0">
                <TrendChart {...shared} />
            </div>
            <div className="flex-1 min-w-0">
                <TrendChart
                    {...shared}
                    threshold={args.threshold ?? DEFAULT_THRESHOLD}
                    thresholdColor={args.thresholdColor}
                    showThresholdLabel={args.showThresholdLabel}
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
        valueRange: { control: 'object' },
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

export const ThresholdWithoutAxisLabel: Story = {
    args: {
        threshold: DEFAULT_THRESHOLD,
        showThresholdLabel: false,
    },
    parameters: {
        docs: {
            description: {
                story: '`showThresholdLabel={false}` keeps the threshold off the value axis. The rule still crosses the plot, the line still changes colour at it and the tooltip still reads it; only the axis goes quiet.',
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

const quietSeries = [
    { label: 'Wed', value: 4 },
    { label: 'Thu', value: 11 },
    { label: 'Fri', value: 7 },
    { label: 'Sat', value: 14 },
    { label: 'Sun', value: 9 },
    { label: 'Mon', value: 12 },
    { label: 'Tue', value: 6 },
];

const busySeries = quietSeries.map(({ label, value }) => ({ label, value: value + 83 }));

const PERCENTAGE_RANGE = { min: 0, max: 100 };

const Labelled = ({ title, children }: PropsWithChildren<{ title: string }>) => (
    <div className="flex flex-column flex-nowrap gap-1 flex-1 min-w-0">
        <span className="text-sm color-weak shrink-0">{title}</span>
        <div className="flex-auto min-h-0">{children}</div>
    </div>
);

export const FixedAxisRange: Story = {
    args: {
        threshold: DEFAULT_THRESHOLD,
        valueRange: PERCENTAGE_RANGE,
    },
    parameters: {
        docs: {
            description: {
                story: '`valueRange={{ min: 0, max: 100 }}` holds both axes at 0–100%, so a quiet server and a busy one are comparable at a glance.\n\nClear `valueRange` in the controls: each axis resizes to its own series and the two draw the same picture, 4% indistinguishable from 87%.',
            },
        },
    },
    render: (args) => (
        <div className="flex flex-nowrap gap-4 h-full">
            <Labelled title="Quiet server">
                <TrendChart {...args} data={quietSeries} />
            </Labelled>
            <Labelled title="Busy server">
                <TrendChart {...args} data={busySeries} />
            </Labelled>
        </div>
    ),
};
