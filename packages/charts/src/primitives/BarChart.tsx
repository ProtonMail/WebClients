import { Bar } from 'react-chartjs-2';

import type { ChartOptions } from 'chart.js';

import { registerCharts } from '../register';

registerCharts();

export type BarChartOptions = ChartOptions<'bar'>;

export const BarChart = Bar;
