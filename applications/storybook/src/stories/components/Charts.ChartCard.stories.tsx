import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { ChartCard, type ChartCardGap } from '@proton/charts/ChartCard';
import { TrendChart } from '@proton/charts/TrendChart';

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

const THRESHOLD = 55;

const cardContent = (
    <>
        <ChartCard.Row>
            <span>Load over the last week</span>
        </ChartCard.Row>
        <ChartCard.Row className="flex-auto min-h-0">
            <TrendChart data={series} transformYAxisValue={formatPercentage} transformTooltipValue={formatPercentage} />
        </ChartCard.Row>
    </>
);

const cardContentWithThreshold = (
    <>
        <ChartCard.Row>
            <span>Load against its limit</span>
        </ChartCard.Row>
        <ChartCard.Row className="flex-auto min-h-0">
            <TrendChart
                data={series}
                threshold={THRESHOLD}
                transformYAxisValue={formatPercentage}
                transformTooltipValue={formatPercentage}
            />
        </ChartCard.Row>
    </>
);

const LoadingPair = () => {
    const [hasArrived, setHasArrived] = useState(false);
    const mode = hasArrived ? 'view' : 'load';

    return (
        <div className="flex flex-column flex-nowrap gap-3 h-full">
            <div className="shrink-0">
                <Button size="small" onClick={() => setHasArrived(!hasArrived)}>
                    {hasArrived ? 'Start loading' : 'Data has arrived'}
                </Button>
            </div>
            <div className="flex flex-nowrap gap-4 flex-auto min-h-0">
                <div className="flex-1 min-w-0">
                    <ChartCard>
                        <ChartCard.Row>
                            <span>Load over the last week</span>
                        </ChartCard.Row>
                        <ChartCard.Row className="flex-auto min-h-0">
                            <TrendChart
                                data={series}
                                mode={mode}
                                transformYAxisValue={formatPercentage}
                                transformTooltipValue={formatPercentage}
                            />
                        </ChartCard.Row>
                    </ChartCard>
                </div>
                <div className="flex-1 min-w-0">
                    <ChartCard>
                        <ChartCard.Row>
                            <span>Load against its limit</span>
                        </ChartCard.Row>
                        <ChartCard.Row className="flex-auto min-h-0">
                            <TrendChart
                                data={series}
                                mode={mode}
                                threshold={THRESHOLD}
                                transformYAxisValue={formatPercentage}
                                transformTooltipValue={formatPercentage}
                            />
                        </ChartCard.Row>
                    </ChartCard>
                </div>
            </div>
        </div>
    );
};

const ROWS = { min: 1, max: 5 };

const FRAME_HEIGHT = '24rem';

const CHART_HEIGHT = '9rem';

const clampRows = (value: string) => {
    const asked = Math.round(Number(value));

    if (!Number.isFinite(asked)) {
        return ROWS.min;
    }

    return Math.min(ROWS.max, Math.max(ROWS.min, asked));
};

const CardRows = ({ gap }: { gap?: ChartCardGap }) => {
    const [rows, setRows] = useState(3);

    const hasTitle = rows >= 2;
    const hasFooter = rows >= 3;
    const charts = rows - Number(hasTitle) - Number(hasFooter);

    return (
        <div className="flex flex-column flex-nowrap gap-3">
            <div className="flex flex-nowrap items-center gap-2 shrink-0">
                <label className="text-sm" htmlFor="chart-card-rows">
                    Rows
                </label>
                <Input
                    id="chart-card-rows"
                    className="w-custom"
                    style={{ '--w-custom': '5rem' }}
                    type="number"
                    min={ROWS.min}
                    max={ROWS.max}
                    value={rows}
                    onValue={(value) => setRows(clampRows(value))}
                />
            </div>
            <ChartCard gap={gap}>
                {hasTitle && (
                    <ChartCard.Row>
                        <span>Load over the last week</span>
                    </ChartCard.Row>
                )}
                {Array.from({ length: charts }, (_, index) => (
                    <ChartCard.Row key={index}>
                        <div className="h-custom" style={{ '--h-custom': CHART_HEIGHT }}>
                            <TrendChart
                                data={series}
                                transformYAxisValue={formatPercentage}
                                transformTooltipValue={formatPercentage}
                            />
                        </div>
                    </ChartCard.Row>
                ))}
                {hasFooter && (
                    <ChartCard.Row className="text-sm color-weak">
                        <span>Sampled twice a day, in per cent of the limit</span>
                    </ChartCard.Row>
                )}
            </ChartCard>
        </div>
    );
};

const meta: Meta<typeof ChartCard> = {
    title: 'Charts/ChartCard',
    args: {
        children: cardContent,
        gap: 4,
    },
    argTypes: {
        gap: { control: { type: 'range', min: 0, max: 8, step: 1 } },
    },
    component: ChartCard,
    decorators: [
        (Story, { parameters }) => (
            <div className="bg-weak p-8 h-custom" style={{ '--h-custom': parameters.frameHeight ?? FRAME_HEIGHT }}>
                <Story />
            </div>
        ),
    ],
    parameters: {
        docs: {
            description: {
                component: 'The frame for the chart.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ChartCard>;

export const Default: Story = {};

export const TwoInARow: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Two of the same card sharing a row.',
            },
        },
    },
    render: (args) => (
        <div className="flex flex-nowrap gap-4 h-full">
            <div className="flex-1 min-w-0">
                <ChartCard {...args} />
            </div>
            <div className="flex-1 min-w-0">
                <ChartCard {...args}>{cardContentWithThreshold}</ChartCard>
            </div>
        </div>
    ),
};

export const Loading: Story = {
    render: () => <LoadingPair />,
};

export const CardWithRows: Story = {
    parameters: {
        frameHeight: 'auto',
        docs: {
            description: {
                story: 'A small playground to showcase how card rows are composed.',
            },
        },
    },
    render: (args) => <CardRows gap={args.gap} />,
};
