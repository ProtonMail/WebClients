import {
    CategoryScale,
    Chart,
    Filler,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
} from 'chart.js';

import { chartRenderStatePlugin } from './plugins/chartRenderState';
import { trendChartPlaceholderTicksPlugin } from './plugins/trendChartPlaceholderTicks/trendChartPlaceholderTicks';
import { trendChartThresholdPlugin } from './plugins/trendChartThreshold/trendChartThreshold';

export const registerCharts = () => {
    Chart.register(
        CategoryScale,
        LinearScale,

        LineController,
        LineElement,
        PointElement,

        Filler,
        Tooltip,

        chartRenderStatePlugin,
        trendChartPlaceholderTicksPlugin,
        trendChartThresholdPlugin
    );
};
