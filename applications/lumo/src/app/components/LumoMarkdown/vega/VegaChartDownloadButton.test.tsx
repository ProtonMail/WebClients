import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { View } from 'vega-typings';

import { triggerFileDownload } from '../../../util/triggerFileDownload';
import { VegaChartDownloadButton } from './VegaChartDownloadButton';

const createNotification = jest.fn();
jest.mock('@proton/app-context/useNotifications', () => ({ useNotifications: () => ({ createNotification }) }));
jest.mock('../../../util/triggerFileDownload', () => ({ triggerFileDownload: jest.fn() }));
jest.mock('../../LumoIcon/LumoIcon', () => ({ LumoIcon: () => null }));

const download = jest.mocked(triggerFileDownload);
const png = new Blob(['PNG'], { type: 'image/png' });
const toBlob = jest.fn();
const toCanvas = jest.fn();

const renderButton = () =>
    render(<VegaChartDownloadButton getView={() => ({ toCanvas }) as unknown as View} filename="chart.png" />);

beforeEach(() => {
    jest.clearAllMocks();
    download.mockResolvedValue(undefined);
    toCanvas.mockResolvedValue({ toBlob });
    toBlob.mockImplementation((callback: BlobCallback) => callback(png));
});

it('exports the chart at double resolution as a PNG Blob', async () => {
    renderButton();
    fireEvent.click(screen.getByRole('button', { name: 'Download chart' }));
    await waitFor(() => expect(download).toHaveBeenCalledWith(png, 'chart.png', 'image'));
    expect(toCanvas).toHaveBeenCalledWith(2);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
    expect(createNotification).not.toHaveBeenCalled();
});

it.each(['render', 'encode', 'handoff'])('shows an error and allows retry after a %s failure', async (stage) => {
    if (stage === 'render') toCanvas.mockRejectedValueOnce(new Error('render failed'));
    if (stage === 'encode') toBlob.mockImplementationOnce((callback: BlobCallback) => callback(null));
    if (stage === 'handoff') download.mockRejectedValueOnce(new Error('bridge failed'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    renderButton();
    const button = screen.getByRole('button', { name: 'Download chart' });
    fireEvent.click(button);
    await waitFor(() => expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: expect.any(String) }));
    await waitFor(() => expect(button).toBeEnabled());
    download.mockClear();
    fireEvent.click(button);
    await waitFor(() => expect(download).toHaveBeenCalledWith(png, 'chart.png', 'image'));
    expect(download).toHaveBeenCalledTimes(1);
    jest.restoreAllMocks();
});
