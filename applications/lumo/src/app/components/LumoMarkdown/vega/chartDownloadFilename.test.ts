import { getChartDownloadFilename } from './chartDownloadFilename';

describe('getChartDownloadFilename', () => {
    it('uses the chart title when present', () => {
        const code = JSON.stringify({
            title: {
                text: 'Geneva Monthly Climate Overview',
                subtitle: 'Temperatures peak in July',
            },
            mark: 'bar',
        });

        expect(getChartDownloadFilename(code)).toBe('geneva-monthly-climate-overview.png');
    });

    it('falls back to chart.png when no title is available', () => {
        expect(getChartDownloadFilename(JSON.stringify({ mark: 'bar' }))).toBe('chart.png');
    });
});
