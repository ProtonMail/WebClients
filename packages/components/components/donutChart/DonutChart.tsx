import percentOf from '@proton/shared/lib/helpers/percentOf';

export interface DonutChartProps {
    /**
     * Array of "number, string" tuples that represent the individual
     * segments of the donut chart, consisting of:
     * `[ percentage (number), color (string)  ]`
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

    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${box} ${box}`}>
            <g>
                {allChunks.map(([percent, color], i) => {
                    const arcLength = Math.max(0, percentOf(percent, circumference) - gap);

                    const strokeDashOffset = offset - percentOf(runningSumOfAllChunks[i - 1] || 0, circumference);

                    console.log(arcLength);

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
