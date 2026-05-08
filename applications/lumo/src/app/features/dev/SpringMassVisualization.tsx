import { LAG0 } from '../../lib/lumo-api-client/core/transforms/smoothing';

interface SpringMassVisualizationProps {
    lag: number;
    differential: number;
    isPulling: boolean;
    rate: number;
}

export const SpringMassVisualization = ({ lag, isPulling, rate }: SpringMassVisualizationProps) => {
    const width = 220;
    const height = 80;
    const restPosition = LAG0;
    const maxLag = 400;

    // Wall on right; mass moves left as lag increases. massX = right edge of mass.
    const massSize = 20;
    const massX = width - massSize - (lag / maxLag) * (width - 60);
    const springStartX = massX;
    const springEndX = width - massSize;

    const springCoils = 8;
    const springAmplitude = 8;
    const springColor = isPulling ? 'var(--signal-danger)' : 'var(--signal-success)';
    const restX = width - 20 - (restPosition / maxLag) * (width - 60);

    const springPath: string[] = [];
    const springLength = springEndX - springStartX;
    const segmentLength = springLength / (springCoils * 2);

    springPath.push(`M ${springStartX} ${height / 2}`);
    for (let i = 0; i < springCoils; i++) {
        const x1 = springStartX + (i * 2 + 1) * segmentLength;
        const x2 = springStartX + (i * 2 + 2) * segmentLength;
        springPath.push(`L ${x1} ${height / 2 - springAmplitude}`);
        springPath.push(`L ${x2} ${height / 2 + springAmplitude}`);
    }
    springPath.push(`L ${springEndX} ${height / 2}`);

    const massOpacity = Math.min(0.4 + (rate / 100) * 0.6, 1);

    return (
        <svg width={width} height={height} style={{ display: 'block', background: 'var(--background-weak)' }}>
            <line
                x1={restX}
                y1={10}
                x2={restX}
                y2={height - 10}
                stroke="var(--text-weak)"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.4"
            />
            <text x={restX} y={8} fontSize="8" fill="var(--text-weak)" textAnchor="middle">
                rest
            </text>

            <rect x={width - 20} y={height / 2 - 15} width={5} height={30} fill="var(--text-norm)" opacity="0.6" />

            <path d={springPath.join(' ')} fill="none" stroke={springColor} strokeWidth="2" opacity="0.8" />

            <rect
                x={massX - massSize}
                y={height / 2 - massSize / 2}
                width={massSize}
                height={massSize}
                fill={springColor}
                opacity={massOpacity}
                stroke="var(--text-norm)"
                strokeWidth="1.5"
            />

            {rate > 1 && (
                <path
                    d={
                        isPulling
                            ? `M ${massX} ${height / 2 - massSize / 2 - 5} L ${massX + 10} ${height / 2 - massSize / 2 - 5} L ${massX + 7} ${height / 2 - massSize / 2 - 8} M ${massX + 10} ${height / 2 - massSize / 2 - 5} L ${massX + 7} ${height / 2 - massSize / 2 - 2}`
                            : `M ${massX - massSize} ${height / 2 - massSize / 2 - 5} L ${massX - massSize - 10} ${height / 2 - massSize / 2 - 5} L ${massX - massSize - 7} ${height / 2 - massSize / 2 - 8} M ${massX - massSize - 10} ${height / 2 - massSize / 2 - 5} L ${massX - massSize - 7} ${height / 2 - massSize / 2 - 2}`
                    }
                    stroke={springColor}
                    strokeWidth="2"
                    fill="none"
                />
            )}

            <text x={10} y={height - 5} fontSize="9" fill="var(--text-weak)">
                {maxLag}
            </text>
            <text x={width - 25} y={height - 5} fontSize="9" fill="var(--text-weak)">
                0
            </text>
        </svg>
    );
};
