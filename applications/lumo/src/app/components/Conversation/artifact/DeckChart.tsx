import type { ChartData } from '../../../util/slides/deck';
import { formatChartValue, isChartLabelled } from '../../../util/slides/deckChartSpec';
import { CHART_LABEL_PT, COLORS } from '../../../util/slides/slideTokens';
import { measureTextPt } from '../../../util/slides/textMetrics';

/**
 * A deck chart for the canvas preview, drawn as plain SVG from the same data and rules as the
 * .pptx chart (labels or axis, zero baseline, colour per series, legend for two or more series,
 * Arial 12pt labels). PowerPoint draws its own native chart, so details like spacing differ a
 * little; the chat chart pipeline isn't used because it restyles charts for chat.
 */

const PX_PER_PT = 4 / 3;
const LABEL_PX = CHART_LABEL_PT * PX_PER_PT;
const FONT = 'Arial, "Liberation Sans", Arimo, sans-serif';
const ROW_PX = LABEL_PX * 1.6;
const AXIS_WIDTH_PX = 56;
const SWATCH_PX = 10;

const hex = (color: string): string => {
    return `#${color}`;
};

const textWidthPx = (text: string): number => {
    return measureTextPt(text, CHART_LABEL_PT, false, 1) * PX_PER_PT;
};

/**
 * Round axis bounds a little beyond the data, like an office app's automatic axis. Zero is always
 * on the axis, so bars grow from it: up for positive values, down for negative ones.
 */
const niceAxis = (values: number[]): { min: number; max: number } => {
    const dataMax = Math.max(0, ...values);
    const dataMin = Math.min(0, ...values);
    if (dataMax === dataMin) {
        return { min: 0, max: 1 };
    }
    const rough = (dataMax - dataMin) / 5;
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const step = [1, 2, 5, 10]
        .map((factor) => {
            return factor * magnitude;
        })
        .find((candidate) => {
            return candidate >= rough;
        })!;
    const max = dataMax > 0 ? Math.ceil(dataMax / step) * step + (dataMax % step === 0 ? step : 0) : 0;
    const min = dataMin < 0 ? Math.floor(dataMin / step) * step - (dataMin % step === 0 ? step : 0) : 0;
    return { min, max };
};

interface LegendProps {
    names: string[];
    colors: string[];
    x: number;
    y: number;
    width: number;
    vertical?: boolean;
}

const Legend = ({ names, colors, x, y, width, vertical }: LegendProps) => {
    const itemWidths = names.map((name) => {
        return SWATCH_PX + 6 + textWidthPx(name) + 16;
    });
    const total = itemWidths.reduce((sum, itemWidth) => {
        return sum + itemWidth;
    }, 0);
    let cursor = x + Math.max(0, (width - total) / 2);
    return (
        <g>
            {names.map((name, index) => {
                const itemX = vertical ? x : cursor;
                const itemY = vertical ? y + index * ROW_PX : y;
                cursor += itemWidths[index]!;
                return (
                    <g key={index}>
                        <rect
                            x={itemX}
                            y={itemY - SWATCH_PX / 2}
                            width={SWATCH_PX}
                            height={SWATCH_PX}
                            fill={colors[index]}
                        />
                        <text x={itemX + SWATCH_PX + 6} y={itemY} dominantBaseline="central" fill={hex(COLORS.inkDim)}>
                            {name}
                        </text>
                    </g>
                );
            })}
        </g>
    );
};

interface ChartAreaProps {
    chart: ChartData;
    width: number;
    height: number;
}

const PieChart = ({ chart, width, height }: ChartAreaProps) => {
    const values = chart.series[0]?.values ?? [];
    const total = values.reduce((sum, value) => {
        return sum + Math.max(value, 0);
    }, 0);
    const colors = COLORS.chartSeries.map(hex);
    const legendWidth = Math.max(
        ...chart.categories.map((category) => {
            return SWATCH_PX + 6 + textWidthPx(category);
        })
    );
    const radius = Math.max(10, Math.min(height / 2 - 8, (width - legendWidth - 48) / 2));
    const cx = (width - legendWidth - 24) / 2;
    const cy = height / 2;
    let angle = -Math.PI / 2;

    return (
        <g>
            {values.map((value, index) => {
                const sweep = total > 0 ? (Math.max(value, 0) / total) * 2 * Math.PI : 0;
                const start = angle;
                angle += sweep;
                const end = angle;
                const large = sweep > Math.PI ? 1 : 0;
                const path =
                    sweep >= 2 * Math.PI - 1e-6
                        ? `M ${cx - radius} ${cy} a ${radius} ${radius} 0 1 0 ${2 * radius} 0 a ${radius} ${radius} 0 1 0 ${-2 * radius} 0`
                        : `M ${cx} ${cy} L ${cx + radius * Math.cos(start)} ${cy + radius * Math.sin(start)} A ${radius} ${radius} 0 ${large} 1 ${cx + radius * Math.cos(end)} ${cy + radius * Math.sin(end)} Z`;
                const middle = (start + end) / 2;
                return (
                    <g key={index}>
                        <path d={path} fill={colors[index % colors.length]} stroke="#FFFFFF" strokeWidth={1.5} />
                        <text
                            x={cx + radius * 0.65 * Math.cos(middle)}
                            y={cy + radius * 0.65 * Math.sin(middle)}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={hex(COLORS.ink)}
                        >
                            {formatChartValue(value, chart)}
                        </text>
                    </g>
                );
            })}
            <Legend
                names={chart.categories}
                colors={colors}
                x={width - legendWidth}
                y={cy - ((chart.categories.length - 1) * ROW_PX) / 2}
                width={legendWidth}
                vertical
            />
        </g>
    );
};

interface BarOrLineChartProps extends ChartAreaProps {}

const BarOrLineChart = ({ chart, width, height }: BarOrLineChartProps) => {
    const labelled = isChartLabelled(chart);
    const multiSeries = chart.series.length > 1;
    const colors = COLORS.chartSeries.map(hex);
    const unitTitle = labelled && chart.unit && chart.unit !== '%' ? chart.unit : undefined;
    const top = (unitTitle ? ROW_PX : 0) + (labelled ? ROW_PX : LABEL_PX / 2);
    const bottom = height - ROW_PX - (multiSeries ? ROW_PX : 0);
    const left = labelled ? 0 : AXIS_WIDTH_PX;
    const plotWidth = width - left;
    const plotHeight = Math.max(bottom - top, 1);
    const axis = niceAxis(
        chart.series.flatMap((series) => {
            return series.values;
        })
    );
    const yFor = (value: number): number => {
        return bottom - ((value - axis.min) / (axis.max - axis.min)) * plotHeight;
    };
    const zeroY = yFor(0);
    const band = plotWidth / chart.categories.length;
    // Matches the .pptx: bar gap 60% of a bar between groups, bars 8% of a bar apart in a group.
    const barWidth = band / (chart.series.length + 0.6 + 0.08 * (chart.series.length - 1));
    const ticks = labelled
        ? []
        : Array.from({ length: 6 }, (_, index) => {
              return axis.min + ((axis.max - axis.min) / 5) * index;
          });

    return (
        <g>
            {unitTitle && (
                <text
                    x={width / 2}
                    y={ROW_PX / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={hex(COLORS.inkDim)}
                >
                    {unitTitle}
                </text>
            )}
            {ticks.map((tick) => {
                return (
                    <g key={tick}>
                        <line
                            x1={left}
                            x2={width}
                            y1={yFor(tick)}
                            y2={yFor(tick)}
                            stroke={hex(COLORS.hairline)}
                            strokeWidth={0.75}
                        />
                        <text
                            x={left - 8}
                            y={yFor(tick)}
                            textAnchor="end"
                            dominantBaseline="central"
                            fill={hex(COLORS.inkDim)}
                        >
                            {formatChartValue(tick, { ...chart, unit: undefined })}
                        </text>
                    </g>
                );
            })}
            <line x1={left} x2={width} y1={zeroY} y2={zeroY} stroke={hex(COLORS.hairline)} strokeWidth={1} />
            {chart.categories.map((category, index) => {
                return (
                    <text
                        key={index}
                        x={left + band * (index + 0.5)}
                        y={bottom + ROW_PX / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={hex(COLORS.inkDim)}
                    >
                        {category}
                    </text>
                );
            })}
            {chart.series.map((series, seriesIndex) => {
                const color = colors[seriesIndex % colors.length];
                if (chart.kind === 'line') {
                    const points = series.values.map((value, index) => {
                        return { x: left + band * (index + 0.5), y: yFor(value), value };
                    });
                    return (
                        <g key={seriesIndex}>
                            <polyline
                                points={points
                                    .map((point) => {
                                        return `${point.x},${point.y}`;
                                    })
                                    .join(' ')}
                                fill="none"
                                stroke={color}
                                strokeWidth={2 * PX_PER_PT}
                            />
                            {points.map((point) => {
                                return (
                                    <g key={point.x}>
                                        <circle cx={point.x} cy={point.y} r={4 * PX_PER_PT} fill={color} />
                                        {labelled && (
                                            <text
                                                x={point.x}
                                                y={point.y - 14}
                                                textAnchor="middle"
                                                fill={hex(COLORS.ink)}
                                            >
                                                {formatChartValue(point.value, chart)}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </g>
                    );
                }
                return (
                    <g key={seriesIndex}>
                        {series.values.map((value, index) => {
                            const groupLeft =
                                left +
                                band * index +
                                (band - barWidth * (chart.series.length + 0.08 * (chart.series.length - 1))) / 2;
                            const x = groupLeft + seriesIndex * barWidth * 1.08;
                            const y = yFor(value);
                            // A negative bar hangs below zero, with its label under its end.
                            const isNegative = value < 0;
                            return (
                                <g key={index}>
                                    <rect
                                        x={x}
                                        y={Math.min(y, zeroY)}
                                        width={barWidth}
                                        height={Math.abs(zeroY - y)}
                                        fill={color}
                                    />
                                    {labelled && (
                                        <text
                                            x={x + barWidth / 2}
                                            y={isNegative ? y + 8 : y - 8}
                                            textAnchor="middle"
                                            dominantBaseline={isNegative ? 'hanging' : undefined}
                                            fill={hex(COLORS.ink)}
                                        >
                                            {formatChartValue(value, chart)}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </g>
                );
            })}
            {multiSeries && (
                <Legend
                    names={chart.series.map((series) => {
                        return series.name;
                    })}
                    colors={colors}
                    x={0}
                    y={height - ROW_PX / 2}
                    width={width}
                />
            )}
        </g>
    );
};

interface Props {
    chart: ChartData;
    /** Size in CSS pixels at the slide's native 960 × 540. */
    width: number;
    height: number;
}

/** The chart's data as text, for screen readers: the drawing itself is hidden from them. */
const describeChart = (chart: ChartData): string => {
    return chart.series
        .map((series) => {
            const points = series.values.map((value, index) => {
                return `${chart.categories[index]} ${formatChartValue(value, chart)}`;
            });
            return `${series.name}: ${points.join(', ')}`;
        })
        .join('; ');
};

export const DeckChart = ({ chart, width, height }: Props) => {
    return (
        <>
            <svg width={width} height={height} fontFamily={FONT} fontSize={LABEL_PX} aria-hidden="true">
                {chart.kind === 'pie' ? (
                    <PieChart chart={chart} width={width} height={height} />
                ) : (
                    <BarOrLineChart chart={chart} width={width} height={height} />
                )}
            </svg>
            <span className="sr-only">{describeChart(chart)}</span>
        </>
    );
};
