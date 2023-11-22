import React, { CSSProperties, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

import { lineChartOptions } from './constants';
import { formatWalletToLineChart } from './utils';

// TODO: remove this when we have wallet API, instraed retrieve last 7 days balance using proton-wallet-core
const lastYDaysBalances: any[] = [
    { date: '20/11/2023', balance: 1.47 },
    { date: '21/11/2023', balance: 3.27 },
    { date: '22/11/2023', balance: 4.22 },
    { date: '23/11/2023', balance: 2.16 },
    { date: '24/11/2023', balance: 2.02 },
    { date: '25/11/2023', balance: 3.13 },
    { date: '26/11/2023', balance: 3.15 },
];

interface Props {
    style?: CSSProperties;
    className?: string;
}

export const LineChart = ({ ...rest }: Props) => {
    const [gradient, setGradient] = useState<CanvasGradient | undefined>();

    useEffect(() => {
        const canvas = document.getElementById('line-chart') as HTMLCanvasElement;
        const ctx = canvas?.getContext('2d');
        setGradient(ctx?.createLinearGradient(0, 0, 0, 200));
    }, []);

    return (
        <div {...rest}>
            <Line
                id="line-chart"
                className="w-full h-full"
                options={lineChartOptions}
                data={formatWalletToLineChart(lastYDaysBalances, gradient)}
            />
        </div>
    );
};
