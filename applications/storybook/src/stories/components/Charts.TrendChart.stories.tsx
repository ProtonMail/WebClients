import { useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import { Slider } from '@proton/atoms/Slider/Slider';
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
const PERCENTAGE_RANGE = { min: 0, max: 100 };
const PERCENTAGE_TICKS = [0, 50, 100];
const RANGES = { '3 days': 6, Week: series.length };
const THRESHOLD_CONTROL = {
    min: PERCENTAGE_RANGE.min,
    max: PERCENTAGE_RANGE.max,
    step: 1,
};
const HEADCOUNT = { quiet: 1, busy: 2 };
const HALF_FULL = (PERCENTAGE_RANGE.min + PERCENTAGE_RANGE.max) / 2;

const propCode = (name: string, value: unknown) => `${name}={${JSON.stringify(value).replace(/,/g, ', ')}}`;

type Range = keyof typeof RANGES;

const Playable = ({ controls, children }: PropsWithChildren<{ controls: ReactNode }>) => (
    <div className="flex flex-column flex-nowrap gap-3 h-full">
        <div className="flex flex-nowrap items-center gap-2 shrink-0">{controls}</div>
        <div className="flex-auto min-h-0">{children}</div>
    </div>
);

const Switch = <T,>({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: { name: string; value: T }[];
    value: T;
    onChange: (value: T) => void;
}) => (
    <>
        <span className="text-sm color-weak">{label}</span>
        {options.map((option) => (
            <Button
                key={option.name}
                size="small"
                shape={option.value === value ? 'solid' : 'outline'}
                color={option.value === value ? 'norm' : 'weak'}
                onClick={() => onChange(option.value)}
            >
                {option.name}
            </Button>
        ))}
    </>
);

const Counted = (args: TrendChartProps) => {
    const [whole, setWhole] = useState(true);

    return (
        <Playable
            controls={
                <Switch
                    label="wholeValues"
                    options={[
                        { name: 'False', value: false },
                        { name: 'True', value: true },
                    ]}
                    value={whole}
                    onChange={setWhole}
                />
            }
        >
            <TrendChart {...args} wholeValues={whole} />
        </Playable>
    );
};

const Code = ({ children }: PropsWithChildren) => (
    <code className="text-sm bg-weak rounded px-1 py-0.5">{children}</code>
);

const Guided = (args: TrendChartProps) => {
    const [guided, setGuided] = useState(true);

    return (
        <Playable
            controls={
                <>
                    <Switch
                        label="showValueGuides"
                        options={[
                            { name: 'False', value: false },
                            { name: 'True', value: true },
                        ]}
                        value={guided}
                        onChange={setGuided}
                    />
                    {guided ? <Code>{propCode('valueTicks', PERCENTAGE_TICKS)}</Code> : null}
                </>
            }
        >
            <TrendChart {...args} showValueGuides={guided} />
        </Playable>
    );
};

const Thresholded = (args: TrendChartProps) => {
    const { threshold: initial, thresholdColor, showThresholdLabel, fill, ...rest } = args;
    const [threshold, setThreshold] = useState(initial ?? DEFAULT_THRESHOLD);
    const [labelled, setLabelled] = useState(true);

    return (
        <Playable
            controls={
                <>
                    <span className="text-sm color-weak">Threshold</span>
                    <div className="w-custom" style={{ '--w-custom': '10rem' }}>
                        <Slider
                            min={THRESHOLD_CONTROL.min}
                            max={THRESHOLD_CONTROL.max}
                            step={THRESHOLD_CONTROL.step}
                            value={threshold}
                            onInput={setThreshold}
                            getDisplayedValue={(value) => `${value}%`}
                        />
                    </div>
                    <Switch
                        label="showThresholdLabel"
                        options={[
                            { name: 'False', value: false },
                            { name: 'True', value: true },
                        ]}
                        value={labelled}
                        onChange={setLabelled}
                    />
                </>
            }
        >
            <TrendChart {...rest} thresholdColor={thresholdColor} threshold={threshold} showThresholdLabel={labelled} />
        </Playable>
    );
};

const Tooltipped = (args: TrendChartProps) => {
    const [named, setNamed] = useState(true);

    return (
        <Playable
            controls={
                <Switch
                    label="Tooltip"
                    options={[
                        { name: 'Wed 76%', value: true },
                        { name: '76%', value: false },
                    ]}
                    value={named}
                    onChange={setNamed}
                />
            }
        >
            <TrendChart {...args} showTooltipLabel={named} />
        </Playable>
    );
};

const RangeFiltered = (args: TrendChartProps) => {
    const [range, setRange] = useState<Range>('Week');

    return (
        <Playable
            controls={
                <Switch
                    label="Range"
                    options={(Object.keys(RANGES) as Range[]).map((name) => ({
                        name,
                        value: name,
                    }))}
                    value={range}
                    onChange={setRange}
                />
            }
        >
            <TrendChart {...args} data={series.slice(-RANGES[range])} />
        </Playable>
    );
};

const Loadable = (args: TrendChartProps) => {
    const [hasArrived, setHasArrived] = useState(false);

    return (
        <Playable
            controls={
                <Button size="small" onClick={() => setHasArrived(!hasArrived)}>
                    {hasArrived ? 'Load again' : 'Data has arrived'}
                </Button>
            }
        >
            <TrendChart {...args} mode={hasArrived ? 'view' : 'load'} />
        </Playable>
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
        threshold: { control: { type: 'range', ...THRESHOLD_CONTROL } },
        valueRange: { control: 'object' },
    },
    component: TrendChart,
    decorators: [
        (Story) => (
            <div
                className="h-custom max-w-custom"
                style={{
                    '--h-custom': FRAME.height,
                    '--max-w-custom': FRAME.maxWidth,
                }}
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
    parameters: {
        docs: {
            description: {
                story: 'The chart as it comes: one series, read for its shape.',
            },
        },
    },
    render: (args) => <TrendChart {...args} />,
};

export const Threshold: Story = {
    args: {
        threshold: DEFAULT_THRESHOLD,
    },
    parameters: {
        docs: {
            description: {
                story: "`threshold` rules the plot at one reading. The line and its fill change colour where they cross it, and the reading is written on the value axis in the rule's own colour.",
            },
        },
    },
    render: (args) => <Thresholded {...args} />,
};

export const Tooltip: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Hovering the plot reads the sample under the cursor.\n\n`showTooltipLabel={false}` drops its name and leaves the value alone — worth it where the label axis already says which sample is which.',
            },
        },
    },
    render: (args) => <Tooltipped {...args} />,
};

export const Filter: Story = {
    args: {
        threshold: DEFAULT_THRESHOLD,
    },
    parameters: {
        docs: {
            description: {
                story: 'Switching the range hands the same chart instance a shorter series, rather than building a new one. chart.js animates between the two.',
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
                story: '`mode="load"` draws a stand-in line in place of a series that has not arrived, with blocks where the labels will go.\n\nPress **Data has arrived** to hand the chart the real series.',
            },
        },
    },
    render: (args) => <Loadable {...args} />,
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

const busySeries = quietSeries.map(({ label, value }) => ({
    label,
    value: value + 83,
}));

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
                story: '`valueRange={{ min: 0, max: 100 }}` holds both axes at 0–100%, so a quiet server and a busy one are comparable at a glance.',
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

const trailingGapSeries = series.map(({ label, value }, index) => ({
    label,
    value: index >= series.length - 2 ? null : value,
}));

export const LatestPoint: Story = {
    args: {
        threshold: DEFAULT_THRESHOLD,
        showLatestPoint: true,
    },
    parameters: {
        docs: {
            description: {
                story: '`showLatestPoint` puts a dot on the last reading there is, in the colour the line carries at that height.',
            },
        },
    },
    render: (args) => <TrendChart {...args} />,
};

const interiorGapSeries = series.map(({ label, value }, index) => ({
    label,
    value: index >= 5 && index <= 7 ? null : value,
}));

export const MissedReadings: Story = {
    args: {
        threshold: DEFAULT_THRESHOLD,
        valueRange: PERCENTAGE_RANGE,
        showLatestPoint: true,
    },
    parameters: {
        docs: {
            description: {
                story: 'A reading that was never taken is `null`, and the line is carried across it: a gap in the telemetry is not the same claim as a reading of zero, which would draw a cliff down to the floor and back.',
            },
        },
    },
    render: (args) => (
        <div className="flex flex-nowrap gap-4 h-full">
            <Labelled title="Three hours missed mid-week">
                <TrendChart {...args} data={interiorGapSeries} />
            </Labelled>
            <Labelled title="Most recent data with a gap">
                <TrendChart {...args} data={trailingGapSeries} />
            </Labelled>
        </div>
    ),
};

const SHORT_GAP = [3];
const LONG_GAP = [8, 9, 10];
const BRIDGED = 2;

const mixedGapSeries = series.map(({ label, value }, index) => ({
    label,
    value: [...SHORT_GAP, ...LONG_GAP].includes(index) ? null : value,
}));

export const BridgedMissedReadings: Story = {
    args: {
        threshold: DEFAULT_THRESHOLD,
        valueRange: PERCENTAGE_RANGE,
        data: mixedGapSeries,
    },
    parameters: {
        docs: {
            description: {
                story: `\`bridgeMissedReadings\` says how far the line is carried over telemetry that never arrived. The series below misses ${SHORT_GAP.length} reading and, later, ${LONG_GAP.length} in a row. A number draws the distinction the booleans cannot: the blip is carried across, the outage breaks the line rather than inventing a trend over it.`,
            },
        },
    },
    render: (args) => (
        <div className="flex flex-nowrap gap-4 h-full">
            <Labelled title="true (default)">
                <TrendChart {...args} />
            </Labelled>
            <Labelled title={propCode('bridgeMissedReadings', BRIDGED)}>
                <TrendChart {...args} bridgeMissedReadings={BRIDGED} />
            </Labelled>
            <Labelled title="false">
                <TrendChart {...args} bridgeMissedReadings={false} />
            </Labelled>
        </div>
    ),
};

export const ChosenValueTicks: Story = {
    args: {
        threshold: DEFAULT_THRESHOLD,
        valueRange: PERCENTAGE_RANGE,
    },
    parameters: {
        docs: {
            description: {
                story:
                    '`' +
                    propCode('valueTicks', PERCENTAGE_TICKS) +
                    '` writes those readings on the value axis in place of the ones the chart would have chosen. A plot read for its shape wants a handful of marks to measure against rather than a full ruler, and the marks it drops are room the line gets back.',
            },
        },
    },
    render: (args) => (
        <div className="flex flex-nowrap gap-4 h-full">
            <Labelled title="valueTicks not set">
                <TrendChart {...args} />
            </Labelled>
            <Labelled title={propCode('valueTicks', PERCENTAGE_TICKS)}>
                <TrendChart {...args} valueTicks={PERCENTAGE_TICKS} />
            </Labelled>
        </div>
    ),
};

export const ValueGuides: Story = {
    args: {
        threshold: DEFAULT_THRESHOLD,
        valueRange: PERCENTAGE_RANGE,
        valueTicks: PERCENTAGE_TICKS,
    },
    parameters: {
        docs: {
            description: {
                story: '`showValueGuides` carries each mark on the value axis across the plot as a faint dashed rule. A number at the edge asks the reader to judge a height against it; the rule is the line they were going to imagine anyway.',
            },
        },
    },
    render: (args) => <Guided {...args} />,
};

const headcountSeries = series.map(({ label, value }) => ({
    label,
    value: value > HALF_FULL ? HEADCOUNT.busy : HEADCOUNT.quiet,
}));

const formatPeople = (value: number) => `${Math.round(value)}`;

export const WholeValues: Story = {
    args: {
        valueRange: { min: HEADCOUNT.quiet, max: HEADCOUNT.busy },
        transformYAxisValue: formatPeople,
        transformTooltipValue: formatPeople,
        data: headcountSeries,
    },
    parameters: {
        docs: {
            description: {
                story: '`wholeValues` holds the value axis to whole numbers.',
            },
        },
    },
    render: (args) => <Counted {...args} />,
};
