import { render, screen } from '@testing-library/react';
import type {
    CartesianScaleOptions,
    ChartData,
    ChartDataset,
    Scale,
    Tick,
    TooltipItem,
    TooltipModel,
    TooltipOptions,
} from 'chart.js';
import { vi } from 'vitest';

import type { BarChartActiveRowOptions } from '../../plugins/barChartActiveRow/barChartActiveRow';
import { BAR_CHART_ACTIVE_ROW_PLUGIN_ID } from '../../plugins/barChartActiveRow/barChartActiveRow';
import type { BarChartValueLabelsOptions } from '../../plugins/barChartValueLabels/barChartValueLabels';
import { BAR_CHART_VALUE_LABELS_PLUGIN_ID } from '../../plugins/barChartValueLabels/barChartValueLabels';
import type { TrendChartPlaceholderTicksOptions } from '../../plugins/trendChartPlaceholderTicks/trendChartPlaceholderTicks';
import {
    PLACEHOLDER_TICKS_ROOM,
    TREND_CHART_PLACEHOLDER_TICKS_PLUGIN_ID,
} from '../../plugins/trendChartPlaceholderTicks/trendChartPlaceholderTicks';
import type { BarChartOptions } from '../../primitives/BarChart';
import { ROW_CURSOR_POSITIONER_ID } from '../../tooltip/rowCursorPosition';
import { HorizontalBarChart } from './HorizontalBarChart';
import { ARRIVAL, BAR, SKELETON_SERIES, TOOLTIP, VALUE_LABEL } from './constants';

const captured = vi.hoisted(() => ({
    calls: [] as { data: ChartData<'bar'>; options: BarChartOptions }[],
}));

vi.mock('react-chartjs-2', () => ({
    Bar: ({ data, options, ...canvasProps }: { data: ChartData<'bar'>; options: BarChartOptions }) => {
        captured.calls.push({ data, options });

        return <canvas data-testid="bar" {...canvasProps} />;
    },
    Line: () => null,
    Doughnut: () => null,
}));

const COLOR = {
    primary: '#6d4aff',
    danger: '#dc3251',
    success: '#1ea885',
    textWeak: '#5c5958',
    borderWeak: '#eae7e4',
    border: '#d1cfcd',
    interactionHover: 'rgb(194 193 192 / 0.2)',
} as const;

const lastCall = () => captured.calls[captured.calls.length - 1];

const lastData = () => lastCall().data;

const lastDataset = () => lastCall().data.datasets[0] as ChartDataset<'bar'> & { backgroundColor: string[] };

const lastOptions = () => lastCall().options;

const valueAxis = () => lastOptions().scales?.x as CartesianScaleOptions;

const categoryAxis = () => lastOptions().scales?.y as CartesianScaleOptions;

const plugins = () => lastOptions().plugins ?? {};

const barLengths = () => {
    const { min, max } = valueAxis();

    return (lastDataset().data as number[]).map((value) => (value - min) / (max - min));
};

const gridValues = () => {
    const axis = { ticks: [{ value: -1 }] as Tick[] } as Scale;

    valueAxis().afterBuildTicks?.(axis);

    return axis.ticks.map(({ value }) => value);
};

const fitNames = (width: number) => {
    const axis = { width } as unknown as Scale;

    categoryAxis().afterFit?.(axis);

    return axis.width;
};

const valueOf = (label: ReturnType<CartesianScaleOptions['ticks']['callback']>) => String(label ?? '');

const categoryLabel = (label: string, index = 0) =>
    valueOf(
        categoryAxis().ticks.callback.call({ getLabelForValue: () => label } as unknown as Scale, index, index, [])
    );

const valueLabels = () => plugins()[BAR_CHART_VALUE_LABELS_PLUGIN_ID] as BarChartValueLabelsOptions;

const activeRow = () => plugins()[BAR_CHART_ACTIVE_ROW_PLUGIN_ID] as BarChartActiveRowOptions;

const placeholderTicks = () => plugins()[TREND_CHART_PLACEHOLDER_TICKS_PLUGIN_ID] as TrendChartPlaceholderTicksOptions;

const tooltip = () => plugins().tooltip as TooltipOptions<'bar'>;

const tooltipModel = {} as TooltipModel<'bar'>;

const tooltipReading = (x: number | null) =>
    tooltip().callbacks.label.call(tooltipModel, { parsed: { x } } as TooltipItem<'bar'>);

const tooltipTitle = () => tooltip().callbacks.title?.call(tooltipModel, []);

const data = [
    { label: 'DEV-VPN', value: 782 },
    { label: 'INFRA-VPN', value: 279 },
    { label: 'STAGING-VPN', value: 72 },
];

beforeEach(() => {
    captured.calls.length = 0;
});

describe('HorizontalBarChart rows', () => {
    it('draws one bar per row, named and in the order it was given', () => {
        render(<HorizontalBarChart data={data} />);

        expect(lastData().labels).toEqual(['DEV-VPN', 'INFRA-VPN', 'STAGING-VPN']);
        expect(lastDataset().data).toEqual([782, 279, 72]);
    });

    it('lies the bars down, which is what makes it the horizontal chart', () => {
        render(<HorizontalBarChart data={data} />);

        expect(lastOptions().indexAxis).toBe('y');
    });

    it('draws nothing where there is nothing to draw, and still rules the plot', () => {
        render(<HorizontalBarChart data={[]} />);

        expect(lastData().labels).toEqual([]);
        expect(lastDataset().data).toEqual([]);
        expect(gridValues()).toHaveLength(5);
    });
});

describe('HorizontalBarChart scale', () => {
    it('measures the bars against the range it was given rather than against its own largest row', () => {
        render(<HorizontalBarChart data={data} valueRange={{ min: 0, max: 1000 }} />);

        expect(valueAxis().min).toBe(0);
        expect(valueAxis().max).toBe(1000);
        expect(barLengths()).toEqual([0.782, 0.279, 0.072]);
    });

    it('spans the readings it was given where no range says otherwise', () => {
        render(<HorizontalBarChart data={data} />);

        expect(valueAxis().min).toBe(72);
        expect(valueAxis().max).toBe(782);
        expect(barLengths()[0]).toBe(1);
    });

    it('leaves the smallest row without a bar, which is what measuring between the readings costs', () => {
        render(<HorizontalBarChart data={data} />);

        expect(barLengths().at(-1)).toBe(0);
    });

    it('draws the smallest row again once a caller says where the scale starts', () => {
        render(<HorizontalBarChart data={data} valueRange={{ min: 0, max: 1000 }} />);

        expect(barLengths().at(-1)).toBeGreaterThan(0);
    });

    it('keeps a span to measure against where the data cannot give one', () => {
        render(<HorizontalBarChart data={[{ label: 'DEV-VPN', value: 0 }]} />);

        expect(valueAxis().max).toBeGreaterThan(valueAxis().min);
    });
});

describe('HorizontalBarChart gridlines', () => {
    it('rules the plot at the quarters of the range, both ends included', () => {
        render(<HorizontalBarChart data={data} valueRange={{ min: 0, max: 100 }} />);

        expect(gridValues()).toEqual([0, 25, 50, 75, 100]);
    });

    it('rules it as often as a caller asks', () => {
        render(<HorizontalBarChart data={data} valueRange={{ min: 0, max: 100 }} gridLines={3} />);

        expect(gridValues()).toEqual([0, 50, 100]);
    });

    it('writes no readings under the lines and draws no axis of its own', () => {
        render(<HorizontalBarChart data={data} />);

        expect(valueAxis().ticks.display).toBe(false);
        expect(valueAxis().border.display).toBe(false);
        expect(valueAxis().grid.color).toBe(COLOR.borderWeak);
    });
});

describe('HorizontalBarChart colours', () => {
    it('paints the series in the colour of what it means, resolved against the theme', () => {
        render(<HorizontalBarChart data={data} fill="success" />);

        expect(lastDataset().backgroundColor).toEqual([COLOR.success, COLOR.success, COLOR.success]);
    });

    it('defaults to the primary colour', () => {
        render(<HorizontalBarChart data={data} />);

        expect(lastDataset().backgroundColor).toEqual([COLOR.primary, COLOR.primary, COLOR.primary]);
    });

    it('lets one row say something the rest of the series does not', () => {
        render(
            <HorizontalBarChart
                data={[
                    { label: 'DEV-VPN', value: 782, fill: 'danger' },
                    { label: 'INFRA-VPN', value: 279 },
                ]}
            />
        );

        expect(lastDataset().backgroundColor).toEqual([COLOR.danger, COLOR.primary]);
    });

    it('leaves a bar the colour it was painted while the pointer is on its row', () => {
        render(<HorizontalBarChart data={data} fill="success" />);

        expect(lastDataset().hoverBackgroundColor).toEqual(lastDataset().backgroundColor);
    });
});

describe('HorizontalBarChart readings', () => {
    it('hands the plugin one reading per bar, as the caller writes them', () => {
        render(<HorizontalBarChart data={data} transformValueLabel={(value) => `${value} users`} />);

        expect(valueLabels().readings).toEqual(['782 users', '279 users', '72 users']);
    });

    it('writes the number itself where the caller says nothing', () => {
        render(<HorizontalBarChart data={data} />);

        expect(valueLabels().readings).toEqual(['782', '279', '72']);
    });

    it('writes them in the muted text colour, past the end of the bar', () => {
        render(<HorizontalBarChart data={data} />);

        expect(valueLabels().textColor).toBe(COLOR.textWeak);
        expect(valueLabels().gapFromBar).toBe(VALUE_LABEL.gapFromBar);
    });
});

describe('HorizontalBarChart names', () => {
    it('names each row as the caller shapes it', () => {
        render(<HorizontalBarChart data={data} transformCategoryValue={(label) => label.replace('-VPN', '')} />);

        expect(categoryLabel('DEV-VPN')).toBe('DEV');
    });

    it('names it as it stands where the caller shapes nothing', () => {
        render(<HorizontalBarChart data={data} />);

        expect(categoryLabel('DEV-VPN')).toBe('DEV-VPN');
    });

    it('never skips a row, however many there are', () => {
        render(<HorizontalBarChart data={data} />);

        expect(categoryAxis().ticks.autoSkip).toBe(false);
    });

    it('says nothing about how much room they take, since chart.js measures them', () => {
        render(<HorizontalBarChart data={data} />);

        expect(categoryAxis().afterFit).toBeUndefined();
    });
});

describe('HorizontalBarChart hovering', () => {
    it('answers to a pointer anywhere along a row, however short the bar', () => {
        render(<HorizontalBarChart data={data} />);

        expect(lastOptions().interaction).toEqual({ mode: 'index', intersect: false, axis: 'y' });
    });

    it('bands the row the pointer is on, in the colour a hovered row is given', () => {
        render(<HorizontalBarChart data={data} />);

        expect(activeRow()).toEqual({ enabled: true, color: COLOR.interactionHover });
    });

    it('walks along with the pointer, held level with the row it is reading', () => {
        render(<HorizontalBarChart data={data} />);

        expect(tooltip().position).toBe(ROW_CURSOR_POSITIONER_ID);
        expect(tooltip().caretPadding).toBe(TOOLTIP.caretPadding);
    });

    it('reads the row as the caller writes it', () => {
        render(<HorizontalBarChart data={data} transformTooltipValue={(value) => `${value} connections`} />);

        expect(tooltipReading(782)).toBe('782 connections');
    });

    it('reads the number itself where the caller says nothing', () => {
        render(<HorizontalBarChart data={data} />);

        expect(tooltipReading(782)).toBe('782');
    });

    it('names the row it is hovering', () => {
        render(<HorizontalBarChart data={data} />);

        expect(tooltipTitle()).toBeUndefined();
    });

    it('goes quiet about the name where the row speaks for itself', () => {
        render(<HorizontalBarChart data={data} showTooltipLabel={false} />);

        expect(tooltipTitle()).toBe('');
    });
});

describe('HorizontalBarChart bars', () => {
    it('keeps a bar from thickening into a slab where a low row count leaves the room', () => {
        render(<HorizontalBarChart data={[{ label: 'DEV-VPN', value: 782 }]} />);

        expect(lastDataset().maxBarThickness).toBe(BAR.maxThickness);
    });

    it('rounds a bar the same way wherever it is drawn', () => {
        render(<HorizontalBarChart data={data} />);

        expect(lastDataset().borderRadius).toBe(BAR.radius);
        expect(lastDataset().categoryPercentage).toBe(BAR.categoryPercentage);
        expect(lastDataset().barPercentage).toBe(BAR.barPercentage);
    });
});

describe('HorizontalBarChart waiting', () => {
    it('stands in for a chart rather than reporting one', () => {
        render(<HorizontalBarChart mode="load" />);

        expect(lastDataset().data).toEqual(SKELETON_SERIES.map(({ value }) => value));
        expect(screen.getByTestId('horizontal-bar-chart-shimmer')).toBeInTheDocument();
    });

    it('writes nothing it does not know, in the gutter or past the bars', () => {
        render(<HorizontalBarChart mode="load" />);

        expect(valueLabels().enabled).toBe(false);
        expect(categoryLabel('DEV-VPN')).toBe('');
    });

    it('keeps the room the blocks it is waiting with need, which no empty name would ask for', () => {
        render(<HorizontalBarChart mode="load" />);

        expect(fitNames(0)).toBe(PLACEHOLDER_TICKS_ROOM);
        expect(fitNames(PLACEHOLDER_TICKS_ROOM + 20)).toBe(PLACEHOLDER_TICKS_ROOM + 20);
    });

    it('blocks out the names it is waiting on, and nothing under the plot where it will never write', () => {
        render(<HorizontalBarChart mode="load" />);

        expect(placeholderTicks()).toMatchObject({
            enabled: true,
            axes: ['y'],
        });
    });

    it('says nothing on hover about readings it does not have, and bands no row', () => {
        render(<HorizontalBarChart mode="load" />);

        expect(tooltip().enabled).toBe(false);
        expect(activeRow().enabled).toBe(false);
    });

    it('leaves the placeholders alone once the data has arrived', () => {
        render(<HorizontalBarChart data={data} />);

        expect(placeholderTicks().enabled).toBe(false);
    });
});

describe('HorizontalBarChart arrival', () => {
    it('grows out of the axis when it draws', () => {
        render(<HorizontalBarChart data={data} />);

        expect(lastOptions().animation).toEqual(ARRIVAL);
    });

    it('appears already drawn while standing in for a chart', () => {
        render(<HorizontalBarChart mode="load" />);

        expect(lastOptions().animation).toBe(false);
    });

    it('does not animate for a reader who asked for less motion, readings included', () => {
        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockReturnValue({
                matches: true,
                media: '(prefers-reduced-motion: reduce)',
                addEventListener: () => {},
                removeEventListener: () => {},
            })
        );

        render(<HorizontalBarChart data={data} />);

        expect(lastOptions().animation).toBe(false);
        expect(valueLabels().fadeInFrom).toBe(0);
    });
});

describe('HorizontalBarChart for assistive tech', () => {
    it('is hidden from a screen reader, since a canvas carries no text to read', () => {
        render(<HorizontalBarChart data={data} />);

        expect(screen.getByTestId('bar')).toHaveAttribute('aria-hidden', 'true');
    });

    it('is named where a caller says what it is', () => {
        render(<HorizontalBarChart data={data} ariaLabel="Connections per gateway" />);

        expect(screen.getByRole('img', { name: 'Connections per gateway' })).toBeInTheDocument();
    });
});

describe('HorizontalBarChart in a container', () => {
    it('fills the room it is given rather than asking for any', () => {
        render(<HorizontalBarChart data={data} />);

        expect(screen.getByTestId('horizontal-bar-chart')).toHaveClass('w-full', 'h-full');
        expect(lastOptions().layout?.padding).toMatchObject({ right: 0 });
    });

    it('stops at the height its rows need, so a few of them are not spread down a tall card', () => {
        render(<HorizontalBarChart data={data} />);

        expect(screen.getByTestId('horizontal-bar-chart')).toHaveStyle({
            maxHeight: `${data.length * BAR.rowPitch}px`,
        });
    });

    it('asks for more room as it is given more rows', () => {
        render(<HorizontalBarChart data={[...data, ...data]} />);

        expect(screen.getByTestId('horizontal-bar-chart')).toHaveStyle({
            maxHeight: `${data.length * 2 * BAR.rowPitch}px`,
        });
    });

    it('asks for no height of its own where it has no rows, rather than for none at all', () => {
        render(<HorizontalBarChart data={[]} />);

        expect(screen.getByTestId('horizontal-bar-chart').style.maxHeight).toBe('');
    });

    it('takes a caller class alongside its own', () => {
        render(<HorizontalBarChart data={data} className="my-4" />);

        expect(screen.getByTestId('horizontal-bar-chart')).toHaveClass('my-4');
    });
});
