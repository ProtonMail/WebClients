import { Line } from 'react-chartjs-2';

import type { ChartOptions } from 'chart.js';

import { registerCharts } from '../register';

registerCharts();

export type LineChartOptions = ChartOptions<'line'>;

/**
 * `react-chartjs-2`'s line chart.
 */
export const LineChart = Line;
