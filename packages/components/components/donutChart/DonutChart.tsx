import percentOf from '@proton/shared/lib/helpers/percentOf';

export interface DonutChartProps {
    /**
     * Array of "number, string" tuples that represent the individual
     * segments of the donut chart, consisting of:
     * `[ percentage (number), color (string)  ]`
     *
     * If the sum of all percentages is less than 100, the DonutChart
     * will display an additional, auto-generated segment using a neutral
     * color to represent an empty or remaining amount. If all percentages
     * sum up to more than 100, the DonutChart will scale all segments
     * relative to the sum of all percentages. It's possible to create a
     * remaining amount manually even if the sum exceeds 100, by creating
     * a custom last chunk with a neutral background.
     */
    chunks: [number, string][];
    /**
     * Gap in absolute viewbox units to apply between individual
     * arc segments of the donut chart.
     */
    gap?: number;
}

const DonutChart = ({ chunks, gap = 4 }: DonutChartProps) => {
    const box = 200;

    const width = box / 6;

    const radius = box / 2 - width / 2;

    const circumference = 2 * Math.PI * radius;

    const offset = percentOf(25, circumference);

    const sumOfAllChunks = chunks.reduce((sum, [n]) => sum + n, 0);

    const runningSumOfAllChunks = chunks.reduce(
        (runningSum, [n], i) => [...runningSum, (runningSum[i - 1] || 0) + n],
        [] as number[]
    );

    const remaining = [100 - sumOfAllChunks, 'var(--background-strong)'] as const;

    const allChunks = [...chunks, remaining];

    /**
     * Make sure arc segments scale relative to either 100 percent or the sum of
     * all chunks should it be greater than 100. Chunk percentages should ideally
     * never add up to more than 100, however if they do all arc segments need to
     * be scaled down to avoid overflow beyond one rotation of the donut.
     */
    const scale = sumOfAllChunks > 100 ? 100 / sumOfAllChunks : 1;

    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${box} ${box}`}>
            <g>
                {allChunks.map(([percent, color], i) => {
                    const arcLength = Math.max(0, percentOf(percent, circumference) - gap) * scale;

                    const strokeDashOffset =
                        offset - percentOf(runningSumOfAllChunks[i - 1] || 0, circumference) * scale;

                    return (
                        <circle
                            style={{ transition: '0.2s' }}
                            fill="none"
                            cx={box / 2}
                            cy={box / 2}
                            r={radius}
                            stroke={color}
                            strokeWidth={width}
                            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
                            strokeDashoffset={strokeDashOffset}
                        />
                    );
                })}
            </g>
        </svg>
    );
};

export default DonutChart;
