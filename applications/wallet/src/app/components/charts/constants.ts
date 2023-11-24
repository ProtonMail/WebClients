import { ChartOptions } from 'chart.js';

export const doughtnutChartOptions: ChartOptions<'doughnut'> = {
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'right', labels: { boxHeight: 10, boxWidth: 10 } },
        title: { display: false },
    },
};

export const lineChartOptions: ChartOptions<'line'> = {
    maintainAspectRatio: false,
    scales: {
        x: { display: false },
        y: { display: false },
    },
    plugins: {
        legend: { display: false },
        title: { display: false },
    },
};
