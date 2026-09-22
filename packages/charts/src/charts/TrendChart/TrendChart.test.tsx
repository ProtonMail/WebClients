import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { TREND_CHART_THRESHOLD_PLUGIN_ID } from '../../plugins/trendChartThreshold/trendChartThreshold';
import type { TrendChartThresholdOptions } from '../../plugins/trendChartThreshold/trendChartThreshold';
import { TrendChart } from './TrendChart';
import type { AxisTick } from './TrendChart.types';
import { ARRIVAL, AXIS, BORDER_WIDTH, TENSION } from './constants';

const captured = vi.hoisted(() => ({ calls: [] as { data: unknown; options: unknown }[] }));

vi.mock('react-chartjs-2', () => ({
    Line: ({ data, options, ...canvasProps }: { data: unknown; options: unknown }) => {
        captured.calls.push({ data, options });

        return <canvas data-testid="line" {...canvasProps} />;
    },
    Bar: () => null,
    Doughnut: () => null,
}));

const lastData = () => captured.calls[captured.calls.length - 1].data as { labels: string[] };

type CapturedDataset = {
    data: number[];
    borderWidth?: number;
    tension?: number;
    borderColor?: (context: unknown) => unknown;
    backgroundColor?: (context: unknown) => unknown;
};

const lastDataset = () =>
    (captured.calls[captured.calls.length - 1].data as { datasets: CapturedDataset[] }).datasets[0];

const gradientSpy = () => {
    const stops: [number, string][] = [];

    const gradient = { addColorStop: (offset: number, color: string) => stops.push([offset, color]) };

    return {
        stops,
        ctx: { createLinearGradient: () => gradient },
    };
};

const scriptableContext = ({
    ctx,
    top = 0,
    bottom = 100,
    pixelForValue = (value: number) => 100 - value,
}: {
    ctx?: unknown;
    top?: number;
    bottom?: number;
    pixelForValue?: (value: number) => number;
} = {}) => ({
    chart: {
        ctx,
        chartArea: { top, bottom },
        scales: { y: { getPixelForValue: pixelForValue } },
    },
});

interface FakeAxis {
    min: number;
    max: number;
    ticks: { value: number; major?: boolean }[];
}

interface FakeTicks {
    color?: (context: { tick?: { value: number } }) => string;
    maxRotation?: number;
    autoSkip?: boolean;
    callback: (
        this: { getLabelForValue: (value: number) => string },
        value: number,
        index: number,
        ticks: AxisTick[]
    ) => string;
}

const yAxis = () =>
    (
        captured.calls[captured.calls.length - 1].options as {
            scales: {
                y: {
                    afterBuildTicks?: (axis: FakeAxis) => void;
                    afterFit?: (axis: FakeFit) => void;
                    ticks: FakeTicks;
                    grid?: { display?: boolean };
                    border?: { display?: boolean };
                };
            };
        }
    ).scales.y;

/** What chart.js hands `afterFit`: the room the axis measured for itself, for the hook to adjust. */
interface FakeFit {
    width: number;
    height: number;
}

/** The room the value axis settles on, having measured `width` for its own labels. */
const fitYAxis = (width: number) => {
    const axis: FakeFit = { width, height: 0 };

    yAxis().afterFit?.(axis);

    return axis.width;
};

/** The room the label axis settles on, having measured `height` for its own labels. */
const fitXAxis = (height: number) => {
    const axis: FakeFit = { width: 0, height };

    (
        captured.calls[captured.calls.length - 1].options as {
            scales: { x: { afterFit?: (axis: FakeFit) => void } };
        }
    ).scales.x.afterFit?.(axis);

    return axis.height;
};

const buildTicks = (values: number[], { min = 0, max = 100 } = {}) => {
    const axis: FakeAxis = { min, max, ticks: values.map((value) => ({ value })) };

    yAxis().afterBuildTicks?.(axis);

    return axis.ticks;
};

const tickValues = (...args: Parameters<typeof buildTicks>) => buildTicks(...args).map(({ value }) => value);

const tickLabel = (value: number, index = 0, ticks: AxisTick[] = [{ value }]) =>
    yAxis().ticks.callback.call({ getLabelForValue: String }, value, index, ticks);

const tooltipLabel = (y: number | null) =>
    (
        captured.calls[captured.calls.length - 1].options as {
            plugins: { tooltip: { callbacks: { label: (context: { parsed: { y: number | null } }) => string } } };
        }
    ).plugins.tooltip.callbacks.label({ parsed: { y } });

const xTicks = () =>
    (
        captured.calls[captured.calls.length - 1].options as {
            scales: { x: { ticks: FakeTicks } };
        }
    ).scales.x.ticks;

const xTickLabel = (labels: string | string[], index = 0, ticks?: AxisTick[]) => {
    const series = Array.isArray(labels) ? labels : [labels];
    const labelAt = (position: number) => series[position] ?? series[series.length - 1];

    return xTicks().callback.call(
        { getLabelForValue: labelAt },
        index,
        index,
        ticks ?? series.map((_, position) => ({ value: position }))
    );
};

const tooltipTitle = () =>
    (
        captured.calls[captured.calls.length - 1].options as {
            plugins: { tooltip: { callbacks: { title?: () => string } } };
        }
    ).plugins.tooltip.callbacks.title;

const thresholdOptions = () =>
    (
        captured.calls[captured.calls.length - 1].options as {
            plugins: { [TREND_CHART_THRESHOLD_PLUGIN_ID]?: TrendChartThresholdOptions };
        }
    ).plugins[TREND_CHART_THRESHOLD_PLUGIN_ID];

const data = [
    { label: 'Mon', value: 10 },
    { label: 'Tue', value: 40 },
    { label: 'Wed', value: 72 },
];

beforeEach(() => {
    captured.calls = [];
});

describe('TrendChart', () => {
    it('forwards the labels and values as a single dataset', () => {
        render(<TrendChart data={data} />);

        expect(lastData().labels).toEqual(['Mon', 'Tue', 'Wed']);
        expect(lastDataset().data).toEqual([10, 40, 72]);
    });

    it("draws the line at the thickness it was given, and at this package's own when it was given none", () => {
        render(<TrendChart data={data} />);

        expect(lastDataset().borderWidth).toBe(BORDER_WIDTH);

        render(<TrendChart data={data} borderWidth={4} />);

        expect(lastDataset().borderWidth).toBe(4);
    });

    it('puts the class name on the box that has the size, not on the canvas', () => {
        const { getByTestId } = render(<TrendChart data={data} className="max-w-custom" />);

        expect(getByTestId('line').parentElement).toHaveClass('max-w-custom');
    });

    it('takes both axes from the container rather than holding an aspect ratio', () => {
        render(<TrendChart data={data} />);

        const options = captured.calls[0].options as { responsive: boolean; maintainAspectRatio: boolean };

        expect(options.responsive).toBe(true);
        expect(options.maintainAspectRatio).toBe(false);
    });

    it('splits the line at the threshold, hard, in the theme colours', () => {
        render(<TrendChart data={data} threshold={80} />);

        const { ctx, stops } = gradientSpy();

        lastDataset().borderColor?.(scriptableContext({ ctx }));

        expect(stops).toEqual([
            [0, '#dc3251'],
            [0.2, '#dc3251'],
            [0.2, '#6d4aff'],
            [1, '#6d4aff'],
        ]);
    });

    it('leaves the line one colour when there is no threshold', () => {
        render(<TrendChart data={data} />);

        expect(lastDataset().borderColor?.(scriptableContext())).toBe('#6d4aff');
    });

    it('takes the two sides of the rule from the colours it was given', () => {
        render(<TrendChart data={data} threshold={80} fill={{ below: 'success', above: 'warning' }} />);

        const { ctx, stops } = gradientSpy();

        lastDataset().borderColor?.(scriptableContext({ ctx }));

        expect(stops).toEqual([
            [0, '#ff9900'],
            [0.2, '#ff9900'],
            [0.2, '#1ea885'],
            [1, '#1ea885'],
        ]);
    });

    it('draws the rule in the colour it introduces', () => {
        render(<TrendChart data={data} threshold={80} fill={{ above: 'warning' }} />);

        expect(thresholdOptions()?.color).toBe('#ff9900');
    });

    it('draws the rule in the colour it was given for it, over the one the series introduces', () => {
        render(<TrendChart data={data} threshold={80} fill={{ above: 'warning' }} thresholdColor="info" />);

        expect(thresholdOptions()?.color).toBe('#239ece');
    });

    it('reads the threshold on the axis in the colour the rule was given', () => {
        render(<TrendChart data={data} threshold={85} fill={{ above: 'warning' }} thresholdColor="info" />);

        expect(yAxis().ticks.color?.({ tick: { value: 85 } })).toBe('#239ece');
        expect(yAxis().ticks.color?.({ tick: { value: 90 } })).toBe('#5c5958');
    });

    it('leaves the series alone: the rule is coloured, not the line above it', () => {
        render(<TrendChart data={data} threshold={80} fill={{ above: 'warning' }} thresholdColor="info" />);

        const { ctx, stops } = gradientSpy();

        lastDataset().borderColor?.(scriptableContext({ ctx }));

        expect(stops).toEqual([
            [0, '#ff9900'],
            [0.2, '#ff9900'],
            [0.2, '#6d4aff'],
            [1, '#6d4aff'],
        ]);
    });

    it('paints the whole series in the one colour the plain shape was given', () => {
        render(<TrendChart data={data} fill="info" />);

        expect(lastDataset().borderColor?.(scriptableContext())).toBe('#239ece');
        expect(lastDataset().backgroundColor?.(scriptableContext())).toBe('rgba(35, 158, 206, 0.16)');
    });

    it("fills under the line in the line's own colour, faintly, on both sides of the rule", () => {
        render(<TrendChart data={data} threshold={80} />);

        const { ctx, stops } = gradientSpy();

        lastDataset().backgroundColor?.(scriptableContext({ ctx }));

        expect(stops).toEqual([
            [0, 'rgba(220, 50, 81, 0.16)'],
            [0.2, 'rgba(220, 50, 81, 0.16)'],
            [0.2, 'rgba(109, 74, 255, 0.16)'],
            [1, 'rgba(109, 74, 255, 0.16)'],
        ]);
    });

    it('gives the threshold a tick of its own on the value axis', () => {
        render(<TrendChart data={data} threshold={85} />);

        expect(tickValues([80, 90])).toEqual([80, 85, 90]);
    });

    it('writes a reading with its own formatter, which is not the axis one', () => {
        render(
            <TrendChart
                data={data}
                transformTooltipValue={(value) => `${value} GB`}
                transformYAxisValue={(value) => `${value}%`}
            />
        );

        expect(tooltipLabel(72)).toBe('72 GB');
        expect(tickLabel(80)).toBe('80%');
    });

    it('shows the bare number as the reading when given no formatter', () => {
        render(<TrendChart data={data} />);

        expect(tooltipLabel(72)).toBe('72');
    });

    it('reads the tooltip value off the chart rather than out of the series it was mounted with', () => {
        const { rerender } = render(<TrendChart data={data} transformTooltipValue={(value) => `${value}%`} />);

        rerender(<TrendChart data={[{ label: 'Mon', value: 5 }]} transformTooltipValue={(value) => `${value}%`} />);

        expect(tooltipLabel(5)).toBe('5%');
    });

    it('drops the name of the sample from the tooltip when asked, leaving the reading', () => {
        render(<TrendChart data={data} showTooltipLabel={false} />);

        expect(tooltipTitle()?.()).toBe('');
    });

    it('leaves the tooltip to name the sample by default', () => {
        render(<TrendChart data={data} />);

        expect(tooltipTitle()).toBeUndefined();
    });

    it("writes the ticks on the time axis with the caller's formatter, from the label rather than the position", () => {
        render(<TrendChart data={data} transformXAxisValue={(label) => label.toUpperCase()} />);

        expect(xTickLabel('Mon')).toBe('MON');
        expect(xTickLabel('Wed')).toBe('WED');
    });

    it('draws neither gridlines nor a rule up the side of the value axis', () => {
        render(<TrendChart data={data} />);

        expect(yAxis().grid?.display).toBe(false);
        expect(yAxis().border?.display).toBe(false);
    });

    it("names a run of samples sharing a label once, at the run's start", () => {
        render(<TrendChart data={data} />);

        expect(xTickLabel(['Wed', 'Wed', 'Thu'], 0)).toBe('Wed');
        expect(xTickLabel(['Wed', 'Wed', 'Thu'], 1)).toBe('');
        expect(xTickLabel(['Wed', 'Wed', 'Thu'], 2)).toBe('Thu');
    });

    it('keeps a run unnamed to its end, however long it is', () => {
        render(<TrendChart data={data} />);

        const week = ['Wed', 'Wed', 'Wed', 'Wed'];

        expect(week.map((_, index) => xTickLabel(week, index))).toEqual(['Wed', '', '', '']);
    });

    it('names a label that returns after another, since that is a run of its own', () => {
        render(<TrendChart data={data} />);

        const week = ['Wed', 'Thu', 'Wed'];

        expect(week.map((_, index) => xTickLabel(week, index))).toEqual(['Wed', 'Thu', 'Wed']);
    });

    it("leaves the caller's formatter unasked for a tick it has already dropped", () => {
        const seen: string[] = [];

        render(
            <TrendChart
                data={data}
                transformXAxisValue={(label) => {
                    seen.push(label);

                    return label.toUpperCase();
                }}
            />
        );

        const week = ['Wed', 'Wed', 'Thu'];

        expect(week.map((_, index) => xTickLabel(week, index))).toEqual(['WED', '', 'THU']);
        expect(seen).toEqual(['Wed', 'Thu']);
    });

    it('keeps the time axis flat and thins it by dropping repeats rather than by counting ticks', () => {
        render(<TrendChart data={data} />);

        expect(xTicks().maxRotation).toBe(0);
        expect(xTicks().autoSkip).toBe(false);
    });

    it('hands the time axis transform which tick it is and every tick', () => {
        const seen: { label: string; index: number; ticks: AxisTick[] }[] = [];
        const ticks: AxisTick[] = [{ value: 0 }, { value: 1 }, { value: 2 }];

        render(
            <TrendChart
                data={data}
                transformXAxisValue={(label, index, all) => {
                    seen.push({ label, index, ticks: all });

                    return label;
                }}
            />
        );

        xTickLabel(['Mon', 'Tue', 'Wed'], 2, ticks);

        expect(seen).toEqual([{ label: 'Wed', index: 2, ticks }]);
    });

    it('hands the value axis transform which tick it is and every tick', () => {
        const seen: { value: number; index: number; ticks: AxisTick[] }[] = [];
        const ticks: AxisTick[] = [{ value: 0 }, { value: 50 }, { value: 100 }];

        render(
            <TrendChart
                data={data}
                transformYAxisValue={(value, index, all) => {
                    seen.push({ value, index, ticks: all });

                    return String(value);
                }}
            />
        );

        tickLabel(50, 1, ticks);

        expect(seen).toEqual([{ value: 50, index: 1, ticks }]);
    });

    it('shows the label as it was given when there is no formatter for the time axis', () => {
        render(<TrendChart data={data} />);

        expect(xTickLabel('Mon')).toBe('Mon');
    });

    it("writes every tick with the caller's formatter, the threshold's included", () => {
        render(<TrendChart data={data} threshold={85} transformYAxisValue={(value) => `${value}%`} />);

        expect(tickLabel(85)).toBe('85%');
        expect(tickLabel(90)).toBe('90%');
    });

    it('leaves the scale to write its own ticks when given no formatter', () => {
        render(<TrendChart data={data} threshold={85} />);

        expect(tickLabel(85)).toBe('85');
        expect(tickLabel(90)).toBe('90');
    });

    it('marks the threshold tick major, so thinning the axis cannot drop it', () => {
        render(<TrendChart data={data} threshold={85} />);

        expect(buildTicks([80, 90]).find(({ value }) => value === 85)?.major).toBe(true);
        expect(buildTicks([80, 90]).find(({ value }) => value === 90)?.major).toBeUndefined();
    });

    it('colours the threshold tick as the rule and leaves the rest of the axis alone', () => {
        render(<TrendChart data={data} threshold={85} fill={{ above: 'warning' }} />);

        expect(yAxis().ticks.color?.({ tick: { value: 85 } })).toBe('#ff9900');
        expect(yAxis().ticks.color?.({ tick: { value: 90 } })).toBe('#5c5958');
    });

    it('leaves the axis untouched when there is no threshold to read on it', () => {
        render(<TrendChart data={data} />);

        expect(yAxis().afterBuildTicks).toBeUndefined();
    });

    it('adds no tick for a threshold the axis already has, or does not reach', () => {
        render(<TrendChart data={data} threshold={80} />);

        expect(tickValues([80, 90])).toEqual([80, 90]);
        expect(tickValues([80, 90], { min: 0, max: 60 })).toEqual([80, 90]);
    });

    it('rejects the two shapes of the prop mixed', () => {
        // @ts-expect-error -- `color` is the plain shape's, and this one has a threshold
        expect(() => render(<TrendChart data={data} threshold={80} fill="info" />)).not.toThrow();

        // @ts-expect-error -- `below` needs a rule to be below
        expect(() => render(<TrendChart data={data} fillBelow="success" />)).not.toThrow();
    });

    it('hands the threshold to the plugin, in the theme colour, rather than adding a dataset', () => {
        render(<TrendChart data={data} threshold={80} />);

        expect(thresholdOptions()).toEqual({ value: 80, color: '#dc3251' });
        expect((captured.calls[0].data as { datasets: unknown[] }).datasets).toHaveLength(1);
    });

    it('moves the rule when the prop changes, rather than capturing it at mount', () => {
        const { rerender } = render(<TrendChart data={data} threshold={80} />);

        expect(thresholdOptions()?.value).toBe(80);

        rerender(<TrendChart data={data} threshold={30} />);

        expect(thresholdOptions()?.value).toBe(30);
    });

    it('configures the plugin with no value when no threshold is given, so it draws nothing', () => {
        render(<TrendChart data={data} />);

        expect(thresholdOptions()?.value).toBeUndefined();
    });

    it('configures the rule on the first render, before any paint', () => {
        vi.stubGlobal('requestAnimationFrame', () => 0);

        render(<TrendChart data={data} threshold={80} />);

        expect(captured.calls).toHaveLength(1);
        expect(thresholdOptions()).toEqual({ value: 80, color: '#dc3251' });
    });
});

describe('TrendChart arrival', () => {
    const animation = () => (captured.calls[captured.calls.length - 1].options as { animation: unknown }).animation;

    it('grows up out of the axis when it draws, which is chart.js resetting to the base and animating off it', () => {
        render(<TrendChart data={[{ label: 'Wed', value: 32 }]} />);

        expect(animation()).toEqual(ARRIVAL);
    });

    it('appears already drawn while standing in for a chart rather than reporting one', () => {
        render(<TrendChart mode="load" />);

        expect(animation()).toBe(false);
    });

    it('does not animate for a reader who asked for less motion', () => {
        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockReturnValue({
                matches: true,
                media: '(prefers-reduced-motion: reduce)',
                addEventListener: () => {},
                removeEventListener: () => {},
            })
        );

        render(<TrendChart data={[{ label: 'Wed', value: 32 }]} />);

        expect(animation()).toBe(false);
    });
});

describe('TrendChart tension', () => {
    it('draws the curve it is asked for, straight segments included', () => {
        render(<TrendChart data={[{ label: 'Wed', value: 32 }]} tension={0} />);

        expect(lastDataset().tension).toBe(0);
    });

    it('curves slightly where nothing asked, which is the default the stand-in also reads', () => {
        render(<TrendChart data={[{ label: 'Wed', value: 32 }]} />);

        expect(lastDataset().tension).toBe(TENSION);
    });
});

describe('TrendChart loading mode', () => {
    const lastOptions = () => captured.calls[captured.calls.length - 1].options;

    it('draws a series of its own, so a caller with nothing yet has nothing to invent', () => {
        render(<TrendChart mode="load" />);

        expect(lastData().labels.length).toBeGreaterThan(1);
        expect(lastDataset().data.every((value) => Number.isFinite(value))).toBe(true);
    });

    it('leaves both axes unwritten, having no readings to put on them', () => {
        render(<TrendChart mode="load" />);

        expect(tickLabel(80)).toBe('');
        expect(xTicks().callback.call({ getLabelForValue: String }, 0, 0, [{ value: 0 }])).toBe('');
    });

    it('writes the axes once it has a series to report', () => {
        render(<TrendChart data={[{ label: 'Wed', value: 32 }]} />);

        expect(tickLabel(80)).toBe('80');
    });

    it('shimmers, since a still chart is a drawn one', () => {
        render(<TrendChart mode="load" />);

        expect(screen.getByTestId('trend-chart-shimmer')).toBeInTheDocument();
    });

    it('stops shimmering once it is reporting', () => {
        render(<TrendChart data={[{ label: 'Wed', value: 32 }]} />);

        expect(screen.queryByTestId('trend-chart-shimmer')).not.toBeInTheDocument();
    });

    it('rules the threshold it is given while loading, so the rule does not appear with the data', () => {
        render(<TrendChart mode="load" threshold={80} />);

        expect(
            (lastOptions() as { plugins: Record<string, unknown> }).plugins[TREND_CHART_THRESHOLD_PLUGIN_ID]
        ).toEqual({ value: 80, color: '#dc3251' });
    });
});

describe('TrendChart accessibility', () => {
    const data = [
        { label: 'Mon', value: 1 },
        { label: 'Tue', value: 2 },
    ];

    it('hides the canvas from assistive tech when no caller names it', () => {
        render(<TrendChart data={data} />);

        const canvas = screen.getByTestId('line');

        expect(canvas).toHaveAttribute('aria-hidden', 'true');
        expect(canvas).not.toHaveAttribute('aria-label');
        expect(canvas).not.toHaveAttribute('role');
    });

    it('names the canvas and promotes it to an image when a caller names it', () => {
        render(<TrendChart data={data} ariaLabel="Devices online over the last week" />);

        const canvas = screen.getByTestId('line');

        expect(canvas).toHaveAttribute('role', 'img');
        expect(canvas).toHaveAttribute('aria-label', 'Devices online over the last week');
        expect(canvas).not.toHaveAttribute('aria-hidden');
    });

    it('names the canvas in loading mode too, so the label does not come and go', () => {
        render(<TrendChart mode="load" ariaLabel="Devices online over the last week" />);

        expect(screen.getByTestId('line')).toHaveAttribute('aria-label', 'Devices online over the last week');
    });

    it('leaves no text equivalent behind, named or not', () => {
        const { container } = render(<TrendChart data={data} ariaLabel="Devices online" />);

        expect(container.textContent).toBe('');
    });
});

describe('TrendChart axis room', () => {
    it('holds the plot in place when the labels measure less than the room kept for them, which is what a loading chart with blank labels measures', () => {
        render(<TrendChart mode="load" />);

        expect(fitYAxis(0)).toBe(AXIS.yWidth);
        expect(fitXAxis(0)).toBe(AXIS.xHeight);
    });

    it('gives wider labels the room they measured rather than clipping them back, so a caller writing “1.2 TB” is not cut off', () => {
        render(<TrendChart data={data} transformYAxisValue={(value) => `${value / 10} TB`} />);

        expect(fitYAxis(72)).toBe(72);
        expect(fitXAxis(40)).toBe(40);
    });
});
