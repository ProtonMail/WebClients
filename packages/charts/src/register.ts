import {
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    Filler,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
} from 'chart.js';

import { barChartActiveRowPlugin } from './plugins/barChartActiveRow/barChartActiveRow';
import { barChartValueLabelsPlugin } from './plugins/barChartValueLabels/barChartValueLabels';
import { chartRenderStatePlugin } from './plugins/chartRenderState';
import { trendChartPlaceholderTicksPlugin } from './plugins/trendChartPlaceholderTicks/trendChartPlaceholderTicks';
import { trendChartThresholdPlugin } from './plugins/trendChartThreshold/trendChartThreshold';
import { registerRowCursorPosition } from './tooltip/rowCursorPosition';

export const registerCharts = () => {
    registerRowCursorPosition();

    Chart.register(
        CategoryScale,
        LinearScale,

        LineController,
        LineElement,
        PointElement,

        BarController,
        BarElement,

        Filler,
        Tooltip,

        chartRenderStatePlugin,
        trendChartPlaceholderTicksPlugin,
        trendChartThresholdPlugin,
        barChartValueLabelsPlugin,
        barChartActiveRowPlugin
    );
};
