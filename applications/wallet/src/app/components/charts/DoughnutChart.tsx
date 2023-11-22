import React, { CSSProperties, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';

import { doughtnutChartOptions } from './constants';
import { formatWalletToDoughnutChart } from './utils';

// TODO: remove this when wallet API is done
const wallets: any[] = [
    { name: 'Bitcoin 01', balance: 1.47 },
    { name: 'Bitcoin 02', balance: 0.05 },
    { name: 'Bitcoin 03', balance: 1.707 },
    { name: 'Lightning 01', balance: 1.126 },
    { name: 'Bitcoin 04', balance: 0.14 },
    { name: 'Lightning 02', balance: 0.86 },
];
interface Props {
    style?: CSSProperties;
    className?: string;
}

export const DoughnutChart = ({ ...rest }: Props) => {
    const formatted = useMemo(() => formatWalletToDoughnutChart(wallets), []);

    return (
        <div {...rest}>
            <Doughnut options={doughtnutChartOptions} data={formatted} />
        </div>
    );
};
