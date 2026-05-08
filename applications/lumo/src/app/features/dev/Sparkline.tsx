export interface TimePoint {
    t: number;
    v: number;
}

interface SparklineProps {
    data: TimePoint[];
    width?: number;
    height?: number;
    color?: string;
    minValue?: number;
    maxValue: number;
    warningThreshold?: number;
    dangerThreshold?: number;
}

export const Sparkline = ({
    data,
    width = 100,
    height = 30,
    color = '#00ff00',
    minValue = 0,
    maxValue,
    warningThreshold,
    dangerThreshold,
}: SparklineProps) => {
    if (data.length < 2) return null;

    const range = maxValue - minValue || 1;

    const oldestTime = data[0].t;
    const newestTime = data[data.length - 1].t;
    const timeWindow = newestTime - oldestTime || 1;

    const points = data.map((point) => {
        const x = ((point.t - oldestTime) / timeWindow) * width;
        const clampedValue = Math.min(Math.max(point.v, minValue), maxValue);
        const y = height - ((clampedValue - minValue) / range) * height;
        return `${x},${y}`;
    });

    const pathData = `M ${points.join(' L ')}`;

    const recentValues = data.slice(-10);
    const hasWarning = warningThreshold && recentValues.some((p) => p.v >= warningThreshold);
    const hasDanger = dangerThreshold && recentValues.some((p) => p.v >= dangerThreshold);

    // eslint-disable-next-line no-nested-ternary
    const lineColor = hasDanger ? 'var(--signal-danger)' : hasWarning ? 'var(--signal-warning)' : color;

    return (
        <svg width={width} height={height} style={{ display: 'block' }}>
            {warningThreshold && (
                <line
                    x1="0"
                    y1={height - ((warningThreshold - minValue) / range) * height}
                    x2={width}
                    y2={height - ((warningThreshold - minValue) / range) * height}
                    stroke="var(--signal-warning)"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                    opacity="0.3"
                />
            )}
            {dangerThreshold && (
                <line
                    x1="0"
                    y1={height - ((dangerThreshold - minValue) / range) * height}
                    x2={width}
                    y2={height - ((dangerThreshold - minValue) / range) * height}
                    stroke="var(--signal-danger)"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                    opacity="0.3"
                />
            )}
            <path d={pathData} fill="none" stroke={lineColor} strokeWidth="1.5" opacity="0.8" />
        </svg>
    );
};
