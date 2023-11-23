import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

import { ChartDataset } from 'chart.js';

import { lineChartOptions } from './constants';

interface Props {
    dataset: ChartDataset<
        'line',
        {
            x: number | string;
            y: number | string;
        }[]
    >;
}

export const LineChart = ({ dataset }: Props) => {
    const [gradient, setGradient] = useState<CanvasGradient | undefined>();

    useEffect(() => {
        const canvas = document.getElementById('line-chart') as HTMLCanvasElement;
        const ctx = canvas?.getContext?.('2d');
        setGradient(ctx?.createLinearGradient?.(0, 0, 0, 200));
    }, []);

    return (
        <Line
            id="line-chart"
            className="w-full h-full"
            options={lineChartOptions}
            data={{
                datasets: [
                    {
                        ...dataset,
                        borderColor: '#704CFF',
                        tension: 0.4,
                        pointRadius: 0,
                        fill: true,
                        backgroundColor: () => {
                            // Add color stops to the gradient
                            gradient?.addColorStop(0, '#E4DEFF');
                            gradient?.addColorStop(0.7, '#E4DEFF00');

                            return gradient ?? 'transparent';
                        },
                    },
                ],
                labels: dataset.data.map(({ x }) => x),
            }}
        />
    );
};
