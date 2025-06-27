import { ThemeColor, getVariableFromThemeColor } from '@proton/colors';
import useUid from '@proton/components/hooks/useUid';
import percentOf from '@proton/utils/percentOf';

export type DonutSegmentColor = ThemeColor | string;

const themeColors = Object.values(ThemeColor);

export interface DonutProps {
    /**
     * Array of "number, string" tuples that represent the individual
     * segments of the donut chart, consisting of:
     * `[ percentage (number), color (ThemeColor | string)  ]`
     *
     * If the sum of all percentages is less than 100, the Donut
     * will display an additional, auto-generated segment using a neutral
     * color to represent an empty or remaining amount. If all percentages
     * sum up to more than 100, the Donut will scale all segments
     * relative to the sum of all percentages. It's possible to create a
     * remaining amount manually even if the sum exceeds 100, by creating
     * a custom last chunk with a neutral background.
     */
    segments: [number, DonutSegmentColor][];
    /**
     * Gap in absolute viewbox units to apply between individual
     * arc segments of the donut chart.
     */
    gap?: number;

    /**
     * color code of background segment
     */
    backgroundSegmentColor?: string;
}

export const Donut = ({ segments, gap = 4, backgroundSegmentColor = 'var(--background-strong)' }: DonutProps) => {
    const uid = useUid('straight-gaps');

    const box = 200;

    const width = box / 6;

    const radius = box / 2 - width / 2;

    const circumference = 2 * Math.PI * radius;

    const offset = percentOf(25, circumference);

    const sumOfAllChunks = segments.reduce((sum, [n]) => sum + n, 0);

    const runningSumOfAllChunks = segments.reduce(
        (runningSum, [n], i) => [...runningSum, (runningSum[i - 1] || 0) + n],
        [] as number[]
    );

    const remaining = [100 - sumOfAllChunks, backgroundSegmentColor] as const;

    const allChunks = [...segments, remaining].map((chunk) => {
        const [percentage, color] = chunk;

        if (themeColors.includes(color as ThemeColor)) {
            return [percentage, `var(${getVariableFromThemeColor(color as ThemeColor)})`] as const;
        }

        return chunk;
    });

    /**
     * Make sure arc segments scale relative to either 100 percent or the sum of
     * all chunks should it be greater than 100. Chunk percentages should ideally
     * never add up to more than 100, however if they do all arc segments need to
     * be scaled down to avoid overflow beyond one rotation of the donut.
     */
    const scale = sumOfAllChunks > 100 ? 100 / sumOfAllChunks : 1;

    return (
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox={`0 0 ${box} ${box}`}>
            {gap > 0 && (
                <defs>
                    <mask id={uid}>
                        <rect x="0" y="0" width={box} height={box} fill="white" />

                        {allChunks.map(([, color], i) => {
                            const angle = scale * percentOf(runningSumOfAllChunks[i - 1] || 0, 360) - 90;

                            return (
                                <rect
                                    key={color}
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
                {allChunks.map(([percentage, color], i) => {
                    const arcLength = scale * Math.max(0, percentOf(percentage, circumference));

                    const strokeDashOffset =
                        offset - scale * percentOf(runningSumOfAllChunks[i - 1] || 0, circumference);

                    const strokeDashArray = `${arcLength.toFixed(2)} ${(circumference - arcLength).toFixed(2)}`;

                    return (
                        <circle
                            key={color}
                            fill="none"
                            cx={box / 2}
                            cy={box / 2}
                            r={radius}
                            stroke={color}
                            strokeWidth={width}
                            strokeDasharray={strokeDashArray}
                            strokeDashoffset={strokeDashOffset}
                        />
                    );
                })}
            </g>
        </svg>
    );
};
