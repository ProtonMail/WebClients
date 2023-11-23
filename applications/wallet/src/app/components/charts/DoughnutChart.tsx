import React from 'react';
import { Doughnut } from 'react-chartjs-2';

import { ChartData } from 'chart.js';

import { doughtnutChartOptions } from './constants';

interface Props {
    data: ChartData<'doughnut', number[], unknown>;
}

export const DoughnutChart = ({ data }: Props) => {
    return <Doughnut options={doughtnutChartOptions} data={data} />;
};
