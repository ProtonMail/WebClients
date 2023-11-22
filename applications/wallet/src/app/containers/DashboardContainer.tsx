import React from 'react';

import { DoughnutChart } from '../components/charts/DoughnutChart';
import { LineChart } from '../components/charts/LineChart';

export const DashboardContainer = () => {
    return (
        <div className="w-full">
            <DoughnutChart className="h-custom w-full" style={{ '--h-custom': '10rem' }} />
            <LineChart className="bg-weak h-custom w-full mt-4" style={{ '--h-custom': '10rem' }} />
        </div>
    );
};
