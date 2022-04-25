import percentOf from '@proton/shared/lib/helpers/percentOf';

import useUid from '../../hooks/useUid';

export interface DonutProps {
    /**
     * Array of "number, string" tuples that represent the individual
     * segments of the donut chart, consisting of:
     * `[ percentage (number), color (string)  ]`
     *
     * If the sum of all percentages is less than 100, the Donut
     * will display an additional, auto-generated segment using a neutral
     * color to represent an empty or remaining amount. If all percentages
     * sum up to more than 100, the Donut will scale all segments
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

const Donut = ({ chunks, gap = 8 }: DonutProps) => {
    const uid = useUid('straight-gaps');

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
            {gap > 0 && (
                <defs>
                    <mask id={uid}>
                        <rect x="0" y="0" width={box} height={box} fill="white" />

                        {allChunks.map((_, i) => {
                            const angle = scale * percentOf(runningSumOfAllChunks[i - 1] || 0, 360) - 90;

                            return (
                                <rect
                                    transform={`rotate(${angle} ${box / 2} ${box / 2})`}
                                    x={box / 2}
                                    y={box / 2 - gap / 2}
                                    width={box / 2 + 1}
                                    height={gap}
                                    fill="black"
                                />
                            );
                        })}
                    </mask>
                </defs>
            )}

            <g mask={gap > 0 ? `url(#${uid})` : undefined}>
                {allChunks.map(([percent, color], i) => {
                    const arcLength = scale * Math.max(0, percentOf(percent, circumference));

                    const strokeDashOffset =
                        offset - scale * percentOf(runningSumOfAllChunks[i - 1] || 0, circumference);

                    return (
                        <circle
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

export default Donut;
