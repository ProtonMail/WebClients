import Donut from '@proton/atoms/Donut/Donut';
import Tooltip from '@proton/components/components/tooltip/Tooltip';

/**
 * [value, color, label]
 * - value: as absolute value
 * - color: any css valid background color
 * - label: any string
 */
export type DoughnutChartData = [number, string, string][];

interface Props {
    data: DoughnutChartData;
    datasetProvidedAsPercentage?: boolean;
}

export const DoughnutChart = ({ data, datasetProvidedAsPercentage = false }: Props) => {
    const total = datasetProvidedAsPercentage ? 1 : data.reduce((acc, [value]) => acc + value, 0);

    return (
        <div className="flex items-center w-full">
            <div className="mr-4" style={{ width: 80 }}>
                <Donut
                    segments={data.map(([value, color]) => {
                        return [(value / total) * 100, color] as const;
                    })}
                />
            </div>
            <div className="flex-1">
                {/* TODO: maybe later find a way to show more than 4 elements */}
                {data.slice(0, 4).map(([value, color, label], index) => (
                    <div key={`donut-label-${index}-${color}`} className="mb-1 flex items-center">
                        <span
                            className="inline-block mr-4 h-custom w-custom"
                            style={{
                                '--h-custom': '0.5rem',
                                '--w-custom': '0.5rem',
                                background: color,
                            }}
                        />
                        <Tooltip title={label}>
                            <strong className="text-sm max-w-custom text-ellipsis max-w-full">
                                <span className="sr-only">{((value / total) * 100).toFixed(2)}%</span>
                                {label}
                            </strong>
                        </Tooltip>
                    </div>
                ))}
            </div>
        </div>
    );
};
