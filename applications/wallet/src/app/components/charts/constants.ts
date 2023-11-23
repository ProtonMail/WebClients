import { ChartOptions } from 'chart.js';

// TODO: change this when we have final color palette
export const colors: string[] = [
    '#FF5733',
    '#33FF57',
    '#5733FF',
    '#FF33A1',
    '#33A1FF',
    '#A1FF33',
    '#FF336E',
    '#336EFF',
    '#6EFF33',
    '#FF3333',
    '#3333FF',
    '#FFAA33',
    '#33FFAA',
    '#AA33FF',
    '#FF33D6',
    '#33D6FF',
    '#D6FF33',
    '#FF33FF',
    '#33FF33',
    '#FF5733',
];

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
